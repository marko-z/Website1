const express = require('express');

const app = express();

app.use(express.urlencoded({ extended : true })); // To get url-encoded data (standard $.post)
app.use(express.json());


//express.static is for serving of static files (enabling server folder access from client)
app.use('/', express.static('public/')); // means '/' in browser points to '/public' on the server, so the former is a virtual path
app.use('/images', express.static('public/images/')); 

const multer = require('multer'); // for posts with images

const storage = multer.diskStorage({ // The functions executed whenever new file received

    //req not populated at this stage --> important to include image at the end of the form

    destination : function(req, file, cb) { //Here we're gonna use the supplied cb to set the storage destination
        cb(null, 'public/images/'); //First argument for errors (not quite sure what it does). The folder HAS to exist
    },
    filename: function(req, file, cb) { 
        cb(null, req.body.author+" "+req.body.date); //Careful -- change the names so they don't include fancy characters, date format adjusted on client side 
    }});

const fileFilter = function(req,file, cb) {
    if (file.mimetype === 'image/jpeg') {
        cb(null, true); // True means that the file is accepted. By changing none to something else we could have an erro instead
    }
    else {
        cb(null, false); // Here for example we could use new Error('some message') instead of none
    }
}

const upload = multer({
    storage : storage, //dest : 'images/'
    limits: {
        fileSize : 1024 * 1024 * 5 
    },
    fileFilter : fileFilter });


/* Errors: the file upload will be treated as 'success' but won't be stored if it 
doesn't satisfy the conditions */


//user 'database'
let users = [
    {username: "doctorwhocomposer", forename: "Delia", surname: "Derbyshire"}
]

//post 'database'
let posts = [
    {
        author: "Delia",
        date:"01-01-2000",
        content: "Look at all these cats! ",
        imagepath: '/images/'+ encodeURIComponent('Delia 13-03-1999.jpg'),
        id: 1
    }
]

//The code below already fixed by the default behaviour whena accessing http://server/

//index (not really important here is it?)
// app.get('/', function(req,res) {
//     res.sendFile(path.join(__dirname,'/index.html')); //path.join very important
// });

//GET all people
app.get('/people', function(req, res) {
    res.send(users);
});

//GET single person
app.get('/people/:username', function (req,res) {
    
    const user = users.find(c => c.username === req.params.username);
    if (!user) {
        res.status(404).send('User not found!');
        return;
    }

    
    res.send(user);
});

//POST new person
app.post('/people', function(req, res) {
    //Is there a function to convert the received serialised data into an object or do I do that myself?
    console.log('Received query: ' + JSON.stringify(req.body)); // To correctly print an object we use stringify

    if (req.body.access_token !== 'concertina'){
        res.status(403).send('Invalid token!');
        return;
    }

    if (users.find(c => c.username === req.body.username)) {
        res.status(400).send('Username taken!');
        console.log(req.body);
        console.log(users)
        return;
    }

    if(!req.body.username || !req.body.forename || !req.body.surname){
        res.status(400).send('Invalid user details (please provide username, forename and surname)');
        return;
    }

    const newUser = {
        username: req.body.username,
        forename: req.body.forename,
        surname: req.body.surname //Gonna duplicate if the same request sent
    }

    users.push(newUser);
    res.send(newUser); 
});



//DELETE chosen person
app.delete('/people/:username', function(req,res) {

    console.log(req.params);
    console.log(users[0]);

    const user = users.find(c => c.username === req.params.username);
    if (!user) {
        res.status(404).send('User not found!');
        return;
    }

    users.splice(users.indexOf(user), 1);
    res.send(user);
    
})


//NEW POST
app.post('/posts', upload.single('userimage'), function (req,res) {
    
    const newPost = {
        author : req.body.author,
        date : req.body.date,
        content : req.body.content,
        id: posts.length + 1
    };

    newPost.imagepath = req.file ?  '/images/' + req.body.author + " " + req.body.date : false;

    posts.push(newPost);
    res.send(newPost);
   
});


//GET POSTS
app.post('/posts/get', function (req, res, next) {
    
    postsToSend = [];

    let i; 
    for (i = 0 ; i < posts.length ; i++) {
        if (!(posts[i].id in req.body.IDs)) {
            postsToSend.push(posts[i]);
        } 
    }
    res.send(postsToSend); 
});

module.exports = app;
