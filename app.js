const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const _ = require("lodash");

const app=express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
require('dotenv').config();

//mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

mongoose.connect("mongodb+srv://"+process.env.USER+":"+process.env.PASSWORD+"@cluster0.yxdqbqi.mongodb.net/todolistDB", {useNewUrlParser:true, useUnifiedTopology:true })
.then( () => console.log("Connection Successfull...."));


const itemsSchema = {
    name: String
}; 

const Item= mongoose.model("Item",itemsSchema);

const item1 = new Item({
    name: "Cook",
});

const item2 = new Item({
    name: "Eat", 
});

const item3 = new Item({
    name: "Sleep",
});

const defaultItems = [item1,item2,item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List",listSchema);



app.get("/",function(req,res){

    Item.find({},function(err,foundItems){

        if (foundItems.length === 0)
        {
            Item.insertMany(defaultItems,function(err){
                if(err)
                {
                    console.log(err)
                }else{
                    console.log("Successfully saved default items to DB.");
                }
            });
            res.redirect("/");
        }else {
            res.render("index",{listTitle:"Today", newListItem:foundItems});
        }
        
    });
});

app.get("/:customListName", function(req,res){
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList){
        if(!err)
        {
            //Create a new List
            if(!foundList){
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/"+customListName);
            }else{
                //Show Existing List
                res.render("index",{listTitle:foundList.name, newListItem:foundList.items});
            }
        }
    })
});

app.post("/",function(req,res){

    const itemName=req.body.newItem;
    const listName=req.body.list;
    const item = new Item({
        name: itemName,
    });

    if(listName==="Today"){
        item.save();
        res.redirect("/");
    }else {
        List.findOne({name: listName}, function(err,foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName);
        });
    }
});

app.post("/delete",function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndDelete(checkedItemId,function(err){
            if(err){
                console.log(err);
            }else{
                console.log("Deleted Successfully");
            }
        })
        res.redirect("/");
    }
    else{
        List.findOneAndUpdate({name:listName}, {$pull: {items: {_id: checkedItemId}}}, function(err,foundList){
            if(!err){
                res.redirect("/"+listName);
            }
        });
    }
    
});

app.get("/about",function(req,res){
    res.render("about");
});


let port = process.env.PORT;
if(port == null || port == "") {
    port=3000;
}


app.listen(port,function(){
    console.log("Server has started succesfully!");
});