var pageHasLoaded = false;

$(document).ready(function() {
	
	
	//
	// Scroll from nav
	//
	var headerHeight = $("nav").outerHeight(true);
	
	$(function() {
	  $('a[href*="#"]:not([href="#"])').click(function() {
	    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
	      var target = $(this.hash);
	      target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
	      if (target.length) {
	        $('html, body').animate({
	          scrollTop: target.offset().top - headerHeight
	        }, 1000);
	        return false;
	      }
	    }
	  });
	});
	
	$(window).scroll(function() {
		//Window Variables
		var windowTop = $(window).scrollTop();
	    var windowHeight = $(window).height();
	    var windowBottom = windowTop + windowHeight;	    
	   
	    
	});
});

window.onload = function(){
	scrollUpdate()
	pageHasLoaded = true
};

function scrollUpdate(){
	//Window Variables
	var windowTop 		= $(window).scrollTop();
    var windowHeight	= $(window).height();
    var windowBottom	= windowTop + windowHeight;


}