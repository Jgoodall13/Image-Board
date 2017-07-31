Handlebars.templates = Handlebars.templates || {};

 var templates = document.querySelectorAll('template');

 Array.prototype.slice.call(templates).forEach(function(tmpl) {
     Handlebars.templates[tmpl.id] = Handlebars.compile(tmpl.innerHTML.replace(/{{&gt;/g, '{{>'));
 });

 Handlebars.partials = Handlebars.templates;

var main = $('#main');

//All the cool kids are doing this now I guess
//***************ROUTER**************//
var Router = Backbone.Router.extend({
    routes: {
        'images': 'images',
        'image/:id': 'image',
        'upload': 'upload'
    },
    images: function() {
        main.off();
        new ImagesView({
            model: new ImagesModel,
            el: '#main'
        });
    },
    image: function(id) {
        main.off();
        new ImageView({
            model: new ImageModel({id:id}),
            el: '#main'
        });
    },
    upload: function() {
        main.off();
        new UploadView({
            model: new UploadModel,
            el: '.modal'
        });
    },
});


//*****************MODELS**************//
var ImagesModel = Backbone.Model.extend({
    initialize: function() {
        this.fetch();
    },
    url: '/images'
});

var ImageModel = Backbone.Model.extend({
    initialize: function(props) {
        console.log(props.id);
        this.url = "/image/" + props.id;
        this.fetch();
    },
    //this might need an Id after image...
});

var UploadModel = Backbone.Model.extend({
    initialize: function() {
        let model = this;
    },
    url: '/upload'
});


//*****************VIEWS**************//
var ImagesView = Backbone.View.extend({
    initialize: function(){
        var view = this;
        this.model.on('change', function() {
            view.render();
        });
    },
    render: function(){
        $('.modal').css({visibility: 'hidden'});
        var html = Handlebars.templates.images(this.model.toJSON());
        this.$el.html(html);
        console.log("images render success");
    },
    events: {
        'click h1': function(){
            console.log('click working');
        }
    }
});

var ImageView = Backbone.View.extend({
    initialize: function(){
        var view = this;
        this.model.on('change', function() {
            view.render();
        });
    },
    render: function(){
        var html = Handlebars.templates.image(this.model.toJSON());
        this.$el.html(html);
        console.log('Image render success');
    },
    events: {
        'click #comment-button': function(){
            $.post('/image:id', {
                image_id: window.location.hash.split("/")[1],
                user: $('#username-comment').val(),
                comment: $('#comment-box').val()
            },
            function(data) {
                $('#username-comment, #comment-box').val(""),
                $("<h2 class='user-tag'><u>user</u>: "+data.user+"</h2><h2 class='comment'><u>comment</u>: "+data.comment+"</h2>").insertAfter( "#h2-post" ).hide().slideDown();
            });
        }
    }
});



var UploadView = Backbone.View.extend({
    initialize: function(){
        var view = this;
        view.render();
    },
    render: function() {
        $('.modal').css({visibility: 'visible'});
        var html = Handlebars.templates.upload;
        this.$el.html(html);
        console.log('upload render success');
    },
    events: {
        'click #button': function(){
            console.log('click ajax success');
            var file = $('input[type="file"]').get(0).files[0];
            var username = $('input[name="username"').val();
            var title = $('input[name="title"').val();
            var description = $('input[name="description"').val();
            var formData = new FormData();

            formData.append('file', file);
            formData.append('username', username);
            formData.append('title', title);
            formData.append('description', description);

            $.ajax({
                url: '/upload',
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(data){
                    console.log(data);
                    window.location.replace("/#images");
                }
            });
        }
    }
});




var router = new Router;
Backbone.history.start();
