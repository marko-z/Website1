"use strict"

//for page changing
const allIDs = ['homepage','userposts','currentusers','test'];

//record of posts so the client can infom the server which posts it already has to prevent unnecessary downloads
let postIDs = [""]; 

//user currently logged on
let currentUser = {};

//website startup procedure to hide contents
let i;
for (i = 0 ; i < allIDs.length ; i++){
    console.log(allIDs[i]);
    $(`#${allIDs[i]}`).addClass('d-none');
}

//switch between pages 
function pageChange(gotoID, allIDs) {
    let i;
    for (i = 0; i < allIDs.length; i++) {
        $(`#${allIDs[i]}`).removeClass('d-block').addClass('d-none');
    }
    $(`#${gotoID}`).removeClass('d-none').addClass('d-block');
}

//update the user button on the navbar
function userRefresh() {
    $('#currentusernav').text(currentUser.forename || "No user loggen in");
}

//website startup procedure for correct user display and homepage
userRefresh();
pageChange('homepage',allIDs);


//activating homepage and posts buttons on navbar
$('#homepagenav').on('click', function() {
    pageChange('homepage',allIDs);
    if (currentUser.username) {
        $("#firsttime").removeClass('d-block').addClass('d-none');
    }
} );

$('#userpostsnav').on('click',function() { //Might be a potential issue here, surprised that allIDs works
    pageChange('userposts',allIDs);
    updatePosts();
    $('#newpostbutton').prop('disabled', currentUser.username ? false : true)
}); 


//post-update function
function updatePosts() {
    $.post('http://localhost:3000/posts/get', {IDs : postIDs}, function (posts) {
        // So this will be sent as url encoded?
        // Simple circuit logic doesn't seem to function for the sent IDs. Ideally I would have IDs empty and here use something like {IDs : postIDs || ""} to prevent sending 'nothing'
        let i;

        for (i = 0 ; i < posts.length ; i++ ) {

            
            let newPost = $('<div class="col-4 limited">'
                + '<div class="card border border-primary">'
                + '<div class="card-body">' 
                +`<h5 class="card-title">${posts[i].author} writes...</h5>`
                +`<p class="card-text">${posts[i].content}.</p>`
                + '</div>'
                + (posts[i].imagepath ? '<img class="card-img-bottom" src="'+ posts[i].imagepath + '" alt="Card image cap"> </div>' : '')
                + `<div class="card-footer text-muted">${posts[i].date} </div>`
                + '</div></div></div>');
            
            $('#posts').append(newPost);
            postIDs.push(posts[i].id);

        }
    });    
}


//Creating new user
$('#createuserbutton').on('click', function() {
    $('#adduser').removeClass('d-none').addClass('d-block');
});

$('#createuser').on('submit', function(e) { 
    
    const dataOut = $(this).serialize(); //fetching data from the form

    $.ajax({
        url: 'http://localhost:3000/people',
        data: dataOut,
        method: "POST",
        success: function(){
            alert('User created!');
        },
        error: function(e){
            alert(`Error: \n${e.status}: ${e.responseText}`);
        }
    });
    e.preventDefault(); //So do we need to catch the form instead and use preventDefault()? No way of taking the button instead?
    $('#adduser').removeClass('d-block').addClass('d-none');
});


//Submitting a new post
$('#newpost').on('submit', function(e) {
    
    e.preventDefault();
    
    let dataOut = new FormData();
    dataOut.append('content', $('#postcontent').val());
    dataOut.append('author', currentUser.username);
    dataOut.append('date', new Date().toISOString().replace(':','-')); //Cannot use new Date().toISOString()
    const file = $('#userimage').prop('files')[0];
    if (file) dataOut.append('userimage', file); 
    //where $('#userimage')[0].files[0] would also work. Standard js equivalent: element.files[0]

    $.ajax({
        url: "http://localhost:3000/posts",
        method: "POST",
        data: dataOut,
        enctype: "multipart/form-data",
        processData: false, //so that the data isn't transformed into a query string?
        contentType: false,
        cache: false, //don't know what these 2 options do
        success: function(){
            alert('Successfully posted');
        },
        error: function(e){
            alert(`Error: \n${e.status}: ${e.responseText}`);
        }
    });
});

//attaching the post submit event to the button in the modal
$('#postsubmitbutton').on('click', function () {
    $('#newpost').submit();
    $('#createPostPopup').modal('hide')
})

$('#closebutton').on('click', function() {
    $('#adduser').removeClass('d-block').addClass('d-none');
});


//Listing current users and user deletion functionality for admin
$('#currentusersnav').on('click', function() {
    pageChange('currentusers',allIDs)
    $.get('http://localhost:3000/people', function(dataIn) {

         // Could perhaps have employed the same "post method" as with posts to repeat sending the same information over and over again but the task specifies 
        $('tbody').html('');

        let i;
        for (i = 0; i < dataIn.length; i++) {

            const username = dataIn[i].username
            const forename = dataIn[i].forename
            const surname = dataIn[i].surname

            $('tbody').append('<tr>'
            +`<td>${username}</td>`
            +`<td>${forename}</td>`
            +`<td id="${surname}td">${surname}</td></tr>`);

            if (currentUser.username === 'admin') {
                $(`#${surname}td`).append(`<button id="${username}del" class="btn float-right btn-outline-danger">Delete</button>`);
                $(`#${username}del`).on('click', null, username, function(event) {
                    deleteUser(event.data);
                    $('#currentusersnav').trigger('click');
                });
            }
        }
        
    });
});   

//Deleting user function
function deleteUser(username) {
    $.ajax({
        url: "http://localhost:3000/people/"+username,
        method: "DELETE",
        succes: function() {
            alert('User '+currentUser.username+' deleted!');
        }
    });
}

//Admin button functionality in User Change
$('#adminbutton').on('click', function() {
    currentUser = {username: "admin", forename: "admin"}
    alert('Admin acces!');
    $('#currentusernav').removeClass('btn-primary').addClass('btn-secondary');
    userRefresh();
    $('#closebutton').trigger('click');
});

//User Change (Other than Admin)
$('#changeusernav').on('click', function() {
    $.get('http://localhost:3000/people', function(dataIn) {

        $('#userchangelist').html(''); // Could perhaps have employed the same "post method" as with posts to repeat sending the same information over and over again but the task specifies 

        let i;
        for (i = 0; i < dataIn.length; i++) {
            $('#userchangelist').append(`<li class="list-group-item"><button type="button" class="btn btn-outline-primary" id="${dataIn[i].username}change">${dataIn[i].forename} ${dataIn[i].surname} (${dataIn[i].username}) </button></li>`);
            $(`#${dataIn[i].username}change`).on('click', null, dataIn[i], function(event) {
                console.log(event.data);
                currentUser = event.data;
                $('#currentusernav').removeClass('btn-secondary').addClass('btn-primary');
                userRefresh();
                $('#closebutton').trigger('click');
            });
           }
        
    });
});

//Adding user change functionality to login button on the home page
$('#firstloginbutton').on('click', () => $('#changeusernav').trigger('click'));

//Delete currently logged on user functionality
$('#deleteusernav').on('click', function() {

    if (currentUser.username === "admin") {
        alert('Cannot delete admin!');
    }
    else if (currentUser.username) {
        deleteUser(currentUser.username);
        currentUser = {};
        userRefresh();
    }
    else {
        alert('You have to log in first!');
    }
});








