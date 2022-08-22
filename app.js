const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require('lodash');
require("dotenv").config();

const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.set("view engine", "ejs");

const mongo_uri = "mongodb+srv://" + process.env.MONGO_USERNAME + ":" + process.env.MONGO_PASSWORD + "@" + process.env.MONGO_CLUSTER + "/todoListDB";

mongoose.connect(mongo_uri, {useNewUrlParser:true, useUnifiedTopology:true,useFindAndModify: false});



const itemsSchema = mongoose.Schema({
  name: String
});

const Item = new mongoose.model("Item" , itemsSchema);
const item1 = new Item({name: "Welcome to your todolist!"});
const item2 = new Item({name: "Hit the + button to add new tasks"});
const item3 = new Item({name: "<-- Hit this to delete me"});

const defaultItems = [item1 , item2 , item3];

const listSchema = mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {

Item.find({},(err,results)=>{
  if(results.length ===0) {
    Item.insertMany(defaultItems , err =>{
      if(err){
        console.log("error occured");
      } else {
        console.log("successfully added default items");
      }
    })
    res.redirect("/");
  } else {
    res.render("list", { listTitle: "Today" , items : results});
  }

 
});
});

// new route for favicon.ico,removing it will cause issue with custom routes
app.get("/favicon.ico", (req,res)=>{
  return;
});

//dynamic routing
app.get("/:customList" , (req,res)=> {
 
  const customList = _.capitalize(req.params.customList);

 List.find({name: customList} , (err,results)=>{
   if(!err) {
     let list = null;    
     //checking to avoid duplicate lists                 
    if(results.length == 0) {                        
    list = new List({
      name: customList,
      items: defaultItems
    });
    list.save();  
    }else {
      list = results[0];                                  
    }

    res.render("list", { listTitle: customList , items: list.items});
   }
  })


  
  
})

app.post("/" , (req,res)=>{
    const newItem = req.body.newItem;
    const listTitle = req.body.listTitle;
    const item = new Item ({
      name: newItem
    });
    if (listTitle === "Today"){
    item.save();

    res.redirect("/");
    } else {
      List.findOne({name: listTitle}, (err, foundList)=>{
        
        foundList.items.push(item);
        foundList.save();
        res.redirect("/"+ listTitle);

      })
    }
})

app.post("/delete",(req,res)=>{
  
  const listTitle = req.body.title;
  const itemCheckedID  = req.body.itemChecked; 
  
  if (listTitle === "Today") {
    Item.deleteOne({_id: itemCheckedID}, err=> {
      if(!err){
        res.redirect("/");
       } 
    })
  } else {
    List.findOneAndUpdate({name: listTitle}, {
      $pull: {items: {_id: itemCheckedID}}}, (err,results) => {
        if(!err) {
          res.redirect("/" + listTitle);
        }
      });
  }
  
  

})




app.listen(process.env.PORT || 3000, function () {
  console.log("server is up and running at port 3000(if localhost)");
})