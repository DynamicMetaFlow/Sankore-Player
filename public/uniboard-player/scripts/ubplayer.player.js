
UbPlayer.Player = function(args) {
  var that = this;
  
  this.thumbsBar = { 
    state:"min", 
    fullHeightVal:100, 
    minHeightVal:0, 
    sliding:false
  };
  this.viewer = new UbPlayer.Viewer();
  this.currentPage = { number:1, ratio:1.6 };
  this.state = "full";
  this.mode = "normal";
  this.resizeMode = "V";
  this.adaptPageTimer = null;
  this.sliderTimer = null;
  this.documentData = args.documentData;
  this.pagesImg = args.pagesImg;
  this.thumbnails = {
    thumbsToHide:[],
    firstVisibleThumb:null,
    next:function(){
      var yToCheck = jQuery("#thumbnails>#thumbnails-canvas>.thumbnail:first").position().top;
      jQuery("#thumbnails>#thumbnails-canvas>.thumbnail").each(function(){
        if(jQuery(this).position().top === yToCheck){
          if(jQuery(this).index() === that.documentData.numberOfPages-1){
            jQuery("#thumbnail-next").addClass("disabled");
            that.thumbnails.thumbsToHide = [];
            return false;
          }
          jQuery("#thumbnail-previous").removeClass("disabled");
          that.thumbnails.thumbsToHide.push(jQuery(this));
        }else{
          that.thumbnails.firstVisibleThumb = jQuery(this);
          return false;
        }
      });
      for(var i=0; i<that.thumbnails.thumbsToHide.length; i++){
        that.thumbnails.thumbsToHide[i].hide();
      }
      that.thumbnails.thumbsToHide = [];
    },
    previous:function(){
      var thumbIndex = 0;
      var currentThumb = null;
      jQuery("#thumbnails>#thumbnails-canvas>.thumbnail").each(function(){
        thumbIndex++;
        currentThumb = jQuery(jQuery("#thumbnails>#thumbnails-canvas>.thumbnail")[that.thumbnails.firstVisibleThumb.index()-thumbIndex]);
        if(currentThumb.length > 0){
          jQuery("#thumbnail-next").removeClass("disabled");
          currentThumb.show();
          if(that.thumbnails.firstVisibleThumb.position().top !== currentThumb.position().top) {
            that.thumbnails.firstVisibleThumb = currentThumb;
            return false;
          }
        }else{
          jQuery("#thumbnail-previous").addClass("disabled");
          return false;
        }
      });
    }
  }
  
  // Events binding  
  jQuery("#menu-button-previous").click(function(){ that.goToPage("PREVIOUS") });
  jQuery("#menu-button-index").toggle(function(){ that.showIndex() }, function(){ that.hideIndex() });
  jQuery("#menu-button-next").click(function(){ that.goToPage("NEXT") });
  jQuery("#board-button-previous").click(function(){ that.goToPage("PREVIOUS") });
  jQuery("#board-button-next").click(function(){ that.goToPage("NEXT") });
  jQuery("#menu-button-index-embed").toggle(function(){ that.showIndex() }, function(){ that.hideIndex() });

  jQuery("#current-page")
    .bind("mouseleave", this.boardButtonOutHandler);
  jQuery("#boards")
    .bind("mouseenter", this.boardButtonOutHandler);

  jQuery("#thumbnail-next").click(function(){that.thumbnails.next()});
  jQuery("#thumbnail-previous").click(function(){that.thumbnails.previous()});
  
  //jQuery("#menu-share-email").click(function(){that.showSharing()});
  jQuery("#menubottom-input").change(function(){ that.goToPage(jQuery("#menubottom-input").val()) });
  jQuery("#menu-button-showdetails")
    .toggle(
      function(){ that.showDescription() },
      function(){ that.hideDescription() });
  jQuery("#shareDoc")
   .toggle(
      function(){ jQuery("#menu-share-dropdown").show() },
      function(){ jQuery("#menu-share-dropdown").hide() });
  jQuery("#quitFullscreen")
    .click(
      function(){ that.switchToNormalMode() });
  jQuery("#quitDescription")
    .click(
      function(){ jQuery("#menu-button-showdetails").click() });
  jQuery("#menu-button-export")
    .toggle(
      function(){ jQuery("#menu-export-dropdown").show() },
      function(){ jQuery("#menu-export-dropdown").hide() })
    .hover(
      function(){ jQuery("#menu-button-export-left").css("background", "url(/uniboard-player/images/menu-button-export-left-over.png)") },
      function(){ jQuery("#menu-button-export-left").css("background", "url(/uniboard-player/images/menu-button-export-left.png)") });
  jQuery("#menu-list-share")
    .toggle(
      function(){ jQuery("#menu-share-dropdown").show() },
      function(){ jQuery("#menu-share-dropdown").hide() });
  jQuery("#menu-button-full").click(function(){ 
    that.switchToFullMode();
  });
  jQuery("#menu-button-showthumbnails").click(function(){
    var newFootHeight = 0;
    var easing = "";
        
    if(that.thumbsBar.state === "min"){
      newFootHeight = that.thumbsBar.fullHeightVal;
      that.thumbsBar.state = "full";
      easing = "easeOutBack";
    } else {
      newFootHeight = that.thumbsBar.minHeightVal;
      that.thumbsBar.state = "min";
      easing = "easeInQuint";
    }
  
    if(that.thumbsBar.state === "full"){
      jQuery("#body").css({paddingBottom:110 + newFootHeight });
      jQuery(window).resize();
    }
    jQuery("#thumbnails").animate(
      {height:32 + newFootHeight},
      400,
      easing,
      function(){ 
        jQuery("#body").css({paddingBottom:110 + newFootHeight });
        jQuery(window).resize();
      }
    );
    jQuery("#foot").animate(
      {height:96 + newFootHeight, marginTop:-96 -newFootHeight},
      400,
      easing
    );
  });

  // Constructs the slider
  var sliderPage = jQuery("#thumbnails-slider>div:first").clone();
  var sliderPageWidth = (100/this.documentData.numberOfPages) + "%";
  jQuery("#thumbnails-slider>div:first").remove();
  for(var i=1; i<=this.documentData.numberOfPages; i++){
    var newSliderPage = sliderPage.clone();
    newSliderPage
      .css({ width:sliderPageWidth })
      .attr("title", "page " + i)
      .click(function(){
        that.goToPage(jQuery(this).index()+1);
      });
    if(i===this.documentData.numberOfPages) newSliderPage.addClass("last");
    jQuery("#thumbnails-slider").append(newSliderPage);
  }

  // Slider handler
  jQuery("#thumbnails-slider>div:first").append(jQuery("#thumbnails-slider-handler"));
  /*jQuery("#thumbnails-slider-handler").draggable({
    axis: 'x',
    containment:[ jQuery("#thumbnails-slider>div:first-child").offset().left, 0, 
                  jQuery("#thumbnails-slider>div:first-child").offset().left + jQuery("#thumbnails-slider>div:first-child").width()*this.documentData.numberOfPages-20, 0  ],
    start:function(e){
      jQuery(this).css({left:"0"});
      jQuery(this).parent("div").css({zIndex:1});
      that.sliderListener(that.currentPage.number);
      that.thumbsBar.sliding = true;
    },
    stop:function(e){
      jQuery(this).css({left:"0"});
      clearTimeout(that.sliderTimer);
      jQuery(this).appendTo(jQuery("#thumbnails-slider>div")[that.currentPage.number-1]);
      that.thumbsBar.sliding = false;
    } 
  });*/
  
  // Load the images
  for(var i=1; i<=this.documentData.numberOfPages; i++){
    this.pagesImg[i] = new Image();
    this.pagesImg[i].src = this.documentData.pagesBaseUrl + "/page" + this.formatPageNumber(i) + ".jpg";
  }
  
  // Add the thumbnails
  var newThumbnail = null;
  var formattedThumbNumber = null;
  for(var i=0; i<this.documentData.numberOfPages; i++){
    newThumbnail = jQuery("#thumbnails>#thumbnails-canvas>.thumbnail:first").clone();
    formattedThumbNumber = this.formatPageNumber(i+1);
    newThumbnail
      .find("img").attr("src", this.documentData.pagesBaseUrl + "/page" + formattedThumbNumber + ".thumbnail.jpg")
      .attr("title", "page " + (i+1));
    jQuery("#thumbnails>#thumbnails-canvas>div:last-child").after(newThumbnail); 
  }
  jQuery("#thumbnails>#thumbnails-canvas>.thumbnail:first").remove();

  jQuery(".thumbnail")
    .hover(
      function(){ jQuery(this).addClass("selected") },
      function(){ jQuery(this).removeClass("selected") })
    .click(function(){
      that.goToPage(jQuery(this).index()+1);
    });

  if(!this.documentData.hasPdf){ 
    jQuery("#menu-export-hasPdf>a").addClass("disabled");
    jQuery("#menu-export-hasPdf").addClass("disabled");
  }else{ 
    jQuery("#menu-export-hasPdf")
      .hover(
        function(){
          jQuery(this).children("a").addClass("over");
          jQuery(this).addClass("over")}, 
        function(){
          jQuery(this).children("a").removeClass("over");
          jQuery(this).removeClass("over");
      })
      .children("a")
        .attr("href", this.documentData.pagesBaseUrl + "/" + this.documentData.uuid + ".pdf")
        .attr("target", "_blank");
  }
  if(!this.documentData.hasUbz){
    jQuery("#menu-export-hasUbz>a").addClass("disabled");
    jQuery("#menu-export-hasUbz").addClass("disabled");
  }else{ 
    jQuery("#menu-export-hasUbz")
      .hover(
        function(){
          jQuery(this).children("a").addClass("over");
          jQuery(this).addClass("over")}, 
        function(){
          jQuery(this).children("a").removeClass("over");
          jQuery(this).removeClass("over");
      })
      .children("a")
        .attr("href", this.documentData.pagesBaseUrl + "/" + this.documentData.uuid + ".ubz")
        .attr("target", "_blank");
  }

  jQuery(document).click(function(){
    if(jQuery("#menu-export-dropdown").css("display") !== "none"){
      jQuery("#menu-button-export").click();
    }
    if(jQuery("#menu-share-dropdown").css("display") !== "none"){
      if(that.state == "embedded"){
        jQuery("#menu-list-share").click();
      }else{
        jQuery("#shareDoc").click();
      }
    }
  });
  jQuery("#menu-share-twitter>a").attr("href", "http://twitter.com/home?status=Currently reading " + this.documentData.pagesBaseUrl);
  jQuery("#description-text").append("<a href='mailto:" + this.documentData.authorEmail + "'>" + this.documentData.author + 
                                      "</a><br/>" + this.documentData.title + 
                                      "<br/>" + this.formatDate(this.documentData.publishedAt) + 
                                      "<br/><br/>" + this.documentData.description);
  jQuery("#menubottom-input").after("/" + this.documentData.numberOfPages);
  
  UbPlayer.reduceDomain();
  this.openPage(1);
};

UbPlayer.Player.prototype.sliderListener = function(currentPageNmbr){
  var that = this;
  var slider = jQuery("#thumbnails-slider-handler");
  var unitWidth = slider.parent("div").width();
  var sliderIndex = 1 + Math.floor((slider.position().left + ((currentPageNmbr-1) * unitWidth)) / unitWidth);	      
  if(sliderIndex !== this.currentPage.number) this.goToPage(sliderIndex);
  this.sliderTimer = setTimeout(function(){that.sliderListener(currentPageNmbr)}, 10);
}

UbPlayer.Player.prototype.boardButtonOutHandler = function(event){
  if( event.pageY >= jQuery("#boards").position().top && 
      event.pageY <= (jQuery("#boards").position().top + jQuery("#boards").height()) ){
    if(event.pageX >= (jQuery("#current-page").position().left + jQuery("#current-page").width())){
      jQuery("#board-button-next").stop().animate({opacity:1}, 200);
    }else if(event.pageX < jQuery("#current-page").position().left){
      jQuery("#board-button-previous").stop().animate({opacity:1}, 200);
    }
  }
}

UbPlayer.Player.prototype.goToPage = function(pageNumber){
  var checkPoint = { finish:"%", start:"%" };
  var that = this;
  
  if(pageNumber === "NEXT"){
    this.currentPage.number++;
    checkPoint = { finish:"-200%", start:"100%" };
  }else if(pageNumber === "PREVIOUS"){
    this.currentPage.number--;
    checkPoint = { finish:"100%", start:"-200%" };
  }else{
    if(pageNumber > this.currentPage.number){
      checkPoint = { finish:"-200%", start:"100%" };
    }else if(pageNumber < this.currentPage.number){
      checkPoint = { finish:"100%", start:"-200%" };
    }else{
      return 0;
    }
    this.currentPage.number = pageNumber;
  }

  if(this.currentPage.number < 1){
    this.currentPage.number = 1;
  }else if(this.currentPage.number > this.documentData.numberOfPages){
    this.currentPage.number = this.documentData.numberOfPages;
  }
	
	jQuery("#current-page")
	  .unbind("mouseenter")
	  .unbind("mouseleave");
	  
	this.viewer.hide();
	
  jQuery("#boards").stop().animate(
    {marginLeft:checkPoint.finish},
    300,
    "easeInQuint",
    function(){
      that.openPage(that.currentPage.number);
      jQuery("#thumbnails").css({width: jQuery("#thumbnails").width()});
      jQuery("#boards").css({ marginLeft:checkPoint.start });
      jQuery("#boards").animate(
        {marginLeft:"0"},
        300,
        "easeOutQuint",
        function(){
          jQuery("#thumbnails").css({width: "auto"});
          jQuery("#current-page")
            .bind("mouseleave", that.boardButtonOutHandler);
        }
      );
    }
  );
}

UbPlayer.Player.prototype.adaptPage = function(){
  jQuery(window).resize();
  this.adaptPageTimer = setTimeout(function(){adaptPage()}, 10);
}

UbPlayer.Player.prototype.switchToFullMode = function(){
  jQuery(".board-button-unit").css("display", "block");
  jQuery("#foot").hide();
  jQuery("#head-list-share").css("display", "none");
  jQuery("#head-list-close").css("display", "inline-block");
  jQuery("#body").css({paddingTop:40, paddingBottom:40});
  jQuery(window).resize();
  this.mode = "full";
}

UbPlayer.Player.prototype.switchToNormalMode = function(){
  jQuery(".board-button-unit").css("display", "none");
  jQuery("#foot").show();
  jQuery("#head-list-share").css("display", "inline-block");
  jQuery("#head-list-close").css("display", "none");
  jQuery("#body").css({paddingTop:40, paddingBottom:110});
  jQuery(window).resize();
  this.mode = "normal";
}

UbPlayer.Player.prototype.showSharing = function(){
  jQuery("#boards").animate({marginTop:"100%"}, function(){
     jQuery(this).hide();
     jQuery("#sharing").show();
   });
}

UbPlayer.Player.prototype.hideSharing = function(){

}

UbPlayer.Player.prototype.showDescription = function(){
  jQuery("#boards").animate({marginTop:"-100%"}, function(){
    jQuery(this).hide();
    jQuery("#description").show();
    jQuery("#head-list-share").css("display", "none");
    jQuery("#head-list-closeDescription").css("display", "inline-block");
  });
}

UbPlayer.Player.prototype.hideDescription = function(){
  jQuery("#description").animate({marginTop:"100%"}, function(){
    jQuery(this)
      .hide()
      .css({marginTop:0});
    jQuery("#boards")
      .show()
      .animate({marginTop:"0px"});
    jQuery("#head-list-share").css("display", "inline-block");
    jQuery("#head-list-closeDescription").css("display", "none");
    jQuery(window).resize();
    jQuery(window).resize();
  });
}

UbPlayer.Player.prototype.showIndex = function(){
  var that = this;
  var thumbsPerRow = Math.round(Math.sqrt(this.documentData.numberOfPages));

  jQuery("#menu-button-previous")
    .addClass("disabled")
    .unbind("click");
  jQuery("#menu-button-next")
    .addClass("disabled")
    .unbind("click");

  jQuery("#boards").animate({marginTop:"-100%"}, function(){
    jQuery(this).hide();
    jQuery("#index")
      .show()
      .empty();
    that.drawIndexThumbnails(thumbsPerRow);
  });
}

UbPlayer.Player.prototype.hideIndex = function(){
  var that = this;
  
  jQuery("#menu-button-previous")
    .removeClass("disabled")
    .bind("click", function(){that.goToPage("PREVIOUS")});
  jQuery("#menu-button-next")
    .removeClass("disabled")
    .bind("click", function(){that.goToPage("NEXT")});
    
  jQuery("#index").hide();
  jQuery("#boards")
    .show()
    .animate({marginTop:"0px"});
}

UbPlayer.Player.prototype.drawIndexThumbnails = function(thumbsPerRow){
  var that = this;
  var newIndex = jQuery("#index>div").length + 1;
  var newIndexThumbnailNumber = this.formatPageNumber(newIndex);
  var newIndexThumbnail = jQuery("<div class='thumbnail index'><img class='thumb-img' src='" + this.documentData.pagesBaseUrl + "/page" + 
                          newIndexThumbnailNumber + 
                          ".thumbnail.jpg' width='auto' height='100%'/></div>");
  newIndexThumbnail
    .hover(
      function(){ if(newIndex !== that.currentPage.number) jQuery(this).addClass("selected") },
      function(){ jQuery(this).removeClass("selected") })
    .click(function(){
      that.goToPage(newIndex);
      jQuery("#menu-button-index").click();
      jQuery(window).resize();
    });
    
  jQuery("#index").append(newIndexThumbnail);
  if(newIndex === this.currentPage.number){ newIndexThumbnail.addClass("current") }
  if((newIndex)%thumbsPerRow === 0)jQuery("#index").append("<br/>");
  if(jQuery("#index>div").length < this.documentData.numberOfPages) setTimeout(function(){that.drawIndexThumbnails(thumbsPerRow)}, 100);
}

UbPlayer.Player.prototype.formatPageNumber = function(pageNumber){
  var formattedPageNumber = ("00" + pageNumber).substr(("00" + pageNumber).length-3, 3);
  return formattedPageNumber;
}

UbPlayer.Player.prototype.formatDate = function(date){
  var months = new Array("January", "February", "March", "April", "May", "June", 
                         "July", "August", "September", "October", "November", "December");
  var formattedDate = "";
  formattedDate = this.documentData.publishedAt.split(" ")[0].split("-");
  formattedDate = formattedDate[2] + " " + months[parseInt(formattedDate[1])-1] + " " + formattedDate[0];
  return formattedDate;
}

UbPlayer.Player.prototype.openPage = function(pageNumber){
  var that = this;
  var formattedPageNumber = this.formatPageNumber(pageNumber);
  var fileName = this.documentData.pagesBaseUrl + "/page" + formattedPageNumber + ".jpg";
  var jsonName = this.documentData.pagesBaseUrl.replace("assets.getuniboard.com", "web.getuniboard.com/assets-proxy") + 
                    "/page" + formattedPageNumber + ".json";
                        
  this.currentPage.number = pageNumber;

  jQuery(".appImg").remove();
  jQuery("#menubottom-input").val(pageNumber);
  jQuery("#thumbnails-slider>div").removeClass("current");
  jQuery(jQuery("#thumbnails-slider>div")[pageNumber-1]).addClass("current");
  //jQuery("#thumbnails-canvas>div").removeClass("current");
  //jQuery(jQuery("#thumbnails-canvas>div")[pageNumber-1]).addClass("current");
  
  jQuery("#current-page>img").attr("src", fileName);
  
  // Slider handler
  if(!this.thumbsBar.sliding)
    jQuery("#thumbnails-slider-handler")
      .appendTo(jQuery("#thumbnails-slider>div")[pageNumber-1])
      .html(pageNumber);
    
  jQuery.getJSON(jsonName, function(data) {
      if(data){
        var scene = {
          x:parseFloat(data.scene.x),
          y:parseFloat(data.scene.y),
          width:parseFloat(data.scene.width),
          height:parseFloat(data.scene.height)
        }
        var widget = {};
        var app = {};
        
        for(var i in data.widgets){
          widget = data.widgets[i];
          app = {
            src:widget.startFile.indexOf("http://") === -1 ? that.documentData.pagesBaseUrl
                + "/" + widget.src + "/" + widget.startFile : widget.startFile,
            img:{
              src:that.documentData.pagesBaseUrl + "/widgets/" + widget.uuid + ".png",
              widthInPercent:parseFloat(widget.width) / scene.width * 100,
              heightInPercent:parseFloat(widget.height) / scene.height * 100,
              leftInPercent:(parseFloat(widget.x) + Math.abs(scene.x)) / scene.width * 100,
              topInPercent:(parseFloat(widget.y) + Math.abs(scene.y)) / scene.height * 100,
              node:jQuery("<div class='appImg'></div>")
            }
          };

          app.img.node
            .css({
              position:"absolute",
              width:app.img.widthInPercent + "%",
              height:app.img.heightInPercent + "%",
              top:app.img.topInPercent + "%",
              left:app.img.leftInPercent + "%"})
            .click(function(app, widget){
              return function(e){
                that.viewer.show(app.src, widget.nominalWidth, widget.nominalHeight);
              }
            }(app, widget))
            .hover(
              function(){
                jQuery(this)
                  .css({
                    background:"url(/uniboard-player/images/app-img-bck.png)",
                  })
                jQuery("#app-border")
                  .appendTo(jQuery(this))
                  .show();
                jQuery("#app-border-middle>img")
                  .animate({opacity:1});
              },
              function(){
                jQuery(this)
                  .css({
                    background:"none",
                  })
                jQuery("#app-border")
                  .hide()
                  .appendTo(jQuery("#current-page"));
                jQuery("#app-border-middle>img")
                  .css({opacity:0});
              }
            )
            .appendTo(jQuery("#current-page"));
                      
          that.currentPage.ratio = scene.width / scene.height;
        }
      }
  });
  
  jQuery(window).resize();

  // Disable previous button if the current page is 1
  if(pageNumber === 1){
    jQuery("#menu-button-previous").unbind("click");
    jQuery("#board-button-previous").unbind("click");
  }else{ // Enable previous button if it has no click event
    if(jQuery("#menu-button-previous").data("events") === null){
      jQuery("#menu-button-previous").bind("click", function(){that.goToPage("PREVIOUS")});
      jQuery("#board-button-previous").bind("click", function(){that.goToPage("PREVIOUS")});
    }
  }
  
  // Disable next button if the current page is the last page
  if(pageNumber === this.documentData.numberOfPages){
    jQuery("#menu-button-next").unbind("click");
    jQuery("#board-button-next").unbind("click");
  }else{ // Enable previous button if it hasn't any click event
    if(jQuery("#menu-button-next").data("events") === null){
      jQuery("#menu-button-next").bind("click", function(){that.goToPage("NEXT")});
      jQuery("#board-button-next").bind("click", function(){that.goToPage("NEXT")});
    }
  }
}
