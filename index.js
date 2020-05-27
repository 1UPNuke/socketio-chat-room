"user strict";

const express = require("express");
const app = require("express")();
const http = require("http").Server(app);
const path = require("path");
const io = require("socket.io")(http);
const host = "localhost";
const port = 80;
var clients = 0;
var messageHistory = [];
var users = [];
var totalClients = 0;

app.use(express.static(__dirname + "/public"));

//Whenever someone connects this gets executed
io.on("connection", function(socket) {
   clients++;
   totalClients++;

   if(users.findIndex((user) => user.id == socket.id) == -1)
   {
      let username = "Anonymous" + totalClients;
      users.push({username:username, id: socket.id});
      io.to(socket.id).emit("usernameChange", username);
      console.log("Socket id: " + socket.id + " has been assigned to user: " + username)
   }
   let user = users[users.findIndex((user) => user.id == socket.id)];

   console.log("A user connected");

   for(let data of messageHistory)
   {
      sendMessage(data.message, data.color, data.username, false, socket.id);
   }
 
   //Sending an object when emmiting an event
   sendMessage(user.username + " has joined the chat! ("+clients+" online)", "00ff00", "SYSTEM");

   socket.on("chatMessage", function(data){
      if(data.message)
      {
         sendMessage(data.message, user.color, user.username);
      }
   });

   socket.on("usernameChange", function(data){
      if(data)
      {
         if(users.findIndex((user) => user.username == data) == -1)
         {
            if(checkAlphaNumeric(data) && data.length <= 16)
            {
               sendMessage(user.username + " has changed their name to " + data, "00ffff", "SYSTEM");
               user.username = data;
               io.to(socket.id).emit("usernameChange", data);
            }
            else
            {
               sendMessage("Username has to be alpha numeric (a-z, A-Z, 0-9) and at max 16 characters long", "ff0000", "SYSTEM", false, socket.id);
            }
         }
         else
         {
            sendMessage("Username is already in use", "ff0000", "SYSTEM", false, socket.id);
         }
      }
   });
    
   //Whenever someone disconnects this piece of code executed
   socket.on("disconnect", function () {
      clients--;
      sendMessage(user.username + " has left the chat! ("+clients+" online)", "ffff00", "SYSTEM");
   });
   
   function sendMessage(message="", color="ffffff", username="USER", history=true, to="all")
   {
      if(to == "all")
      {
         io.emit("chatMessage", {
            message: HTMLEncode(message),
            color: HTMLEncode(color),
            username: HTMLEncode(username),
            timestamp: new Date()
         });
      }
      else
      {
         io.to(to).emit("chatMessage", {
            message: HTMLEncode(message),
            color: HTMLEncode(color),
            username: HTMLEncode(username),
            timestamp: new Date()
         });
      }
      if(history)
      {
         messageHistory.push({
            message: message,
            color: color,
            username: username,
            timestamp: new Date()
         });
      }
      console.log("New message to ["+ to +"]: ["+username+"]: "+ message);
   }
});

function checkAlphaNumeric(data)
{
   return data.match(/^[a-zA-Z0-9\s]+$/);
}

function HTMLEncode(str) {
   var i = str.length,
       aRet = [];

   while (i--) {
       var iC = str[i].charCodeAt();
       if (iC < 65 || iC > 127 || (iC>90 && iC<97)) {
           aRet[i] = "&#"+iC+";";
       } else {
           aRet[i] = str[i];
       }
   }
   return aRet.join("");
}

http.listen(port, host, function() {
   console.log("Listening on "+host+":"+port);
});