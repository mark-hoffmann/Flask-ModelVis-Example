$(document).ready(function() {
	//
	// Sandwich menu
	//
	$('.mobile button').click(function() {
		$(this).toggleClass('expanded').siblings('div').slideToggle();		
		$('#header').toggleClass('nav-expanded');
	});
});