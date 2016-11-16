var EnjoyHandler  = (function($,undefined){

   function EnjoyHandler(){

   }

   var ep = EnjoyHandler.prototype;

   ep.initialize = function(){
        var emojiContainer = $('#emojiWrapper');
        for (var i = 69; i > 0; i--) {
            var tag = "<li><img src='./public/content/emoji/"+ i + ".gif'></li>";
            emojiContainer.append(tag);
        };
   }

   var instance;
   return {
       getInstance:function(){
           if(!instance){
               instance = new EnjoyHandler();
           }
           return instance;
       }
   }
})(jQuery)

function initialize(){
    
}
$(document).ready(function(){
    EnjoyHandler.getInstance().initialize();
});