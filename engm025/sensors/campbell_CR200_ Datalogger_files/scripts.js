var mdiv = 'blank_receiver';
var tmpvar = '';

$(function(){
	//menupostLoad(1);
	//$("#dbox").dialog({autoOpen:false,modal:true,width:'auto',height:'auto'});
	//var megaConfig = {interval:150,sensitivity:4,over:loadMenu,timeout:100,out:emptyCall};
	//$(".mega").hoverIntent(megaConfig);
	//$(".menu").click(function(){event.preventDefault();});
	$('.crumb').hover(
		function () {
			$(this).html($(this).attr("title"));
		},
		function () {
			$(this).html($(this).attr("title").split(' ')[0] + '...');
		}
	);
	$(document).on("click", ".pop", function (event) {
		event.preventDefault();
		loadContentpopup($(this).attr('rel'));
		trackPageview($(this).attr('href'));
	});

	//Initialize popovers globally
	$('[data-toggle="popover"]').popover();
	$(document).on("click", '[data-toggle="popover"]', function(event){
		$(event.target).popover('toggle');
	});


	//global handlers for Google Analytics Event Tracking
	$(document).on("click", ".gaq", function () {
		trackEvent($(this).data("track"));
	});
	$(document).on("keypress", ".gaq", function (event) {
		if (event.which === 13) {
			trackEvent($(this).data("track"));
		}
	});
	$("body").on("click", "#sol-accordion input", function () {
		$("#fake-solution").val(this.id).trigger("change");
	});
	//focus search input not on android
	if (!isAndroid() && !$(":input").is(':focus')) {
		$('.siteSearch').focus();
	}

	//known problem - this autocomplete breaks in IE8 so we use the simple version in the else
	if (navigator.appVersion.indexOf("MSIE 8.") == -1) {
		$(".siteSearch").each(function () {
			$this = $(this);
			$this.autocomplete({
				source: "/actions/misc.cfc?method=productIndex&mode=standard",
				minLength: 1,
				delay: 0,
				autoFocus: true,
				appendTo: $this.parents("div.container"),
				select: function (event, ui) {
					event.preventDefault();
					window.location = ui.item.id;
				},
				focus: function (event, ui) {
					event.preventDefault();
				},
				search: function (event, ui) {
					//disable product index if preference not set
					if (getCookie("CS_SEARCH_PREF") !== "productIndex") {
						return false;
					}
				}
				//customize what's getting dumped
			}).data("ui-autocomplete")._renderItem = function (ul, item) {
				var $li = $('<li>'),
					$img = $('<img>');
				$img.attr({
					src: item.icon
				});
				$li.attr('data-value', item.label);
				$li.append('<a href="' + item.id + '">');
				$li.find('a').append('<div class="autocomplete-item-img left center">').append(item.label);
				$li.find('div').append($img)
				return $li.appendTo(ul);
			};
		});

	} else {
		$(".siteSearch").each(function () {
			$this = $(this);
			$this.autocomplete({
				source: "/actions/misc.cfc?method=productIndex&mode=plain",
				minLength: 1,
				delay: 0,
				autoFocus: true,
				appendTo: $this.parents("div.container"),
				select: function (event, ui) {
					window.location = ui.item.id;
				},
				search: function (event, ui) {
					//disable product index if preference not set
					if (getCookie("CS_SEARCH_PREF") !== "productIndex") {
						return false;
					}
				}
			});
		});
	}

	$("body").on("click", "#srch-toggle", function () {
		setTimeout(function () {
			$("#q-second").focus();
		}, 0);
	}).on("click", "i.fssearch", function () {
		setTimeout(function () {
			$("#q-first").focus();
		}, 0);
	});

	//Temp to see how we like having an opacity for content scrolling into the header
	$('#headerFade').fadeTo(0, 0.5);

	//don't allow disabled links to work
	$(document).on("click keydown", "a.disable", function (event) {
		event.preventDefault();
		event.stopPropagation();
		return false;
	});
	$("#quoter").on("click", function (event) {
		event.preventDefault();
		var pid = $(this).data("pid");
		crsr("wait");
		$.ajax({
			type: "POST",
			data: {
				id: pid,
				configuration: "",
				plist: ""
			},
			url: "/actions/cart.cfc?method=addToCart",
			success: function (res) {
				crsr("default");
				var result = res;
				if (result.status === 200) {
					updateCartCount(result.count);
					$("#quoter").popover({
						placement: "left",
						trigger: "focus",
						html: "true",
						container: ".posRel"
					}).popover("show");
					$('.popover span').css('color', 'green');
				}
			}
		});
	});
	$("div.slider-menu").on("click", ".slider-btn", function (event) {
		if ($(document).width() > 900) {
			event.stopPropagation();
		}
	});
	setLocalTime();

	$('div.overflow-watch').each(function () {
		//var elt, hasOverflow = (elt = $(this)).innerWidth() > elt[0].scrollWidth;
		var maxHeight = 400;
		if($(this).attr('data-height')){
			maxHeight = $(this).attr('data-height');
		}
		overflowheight = $(this).height();
		if (overflowheight > maxHeight) {
			$(this).css('overflow', 'hidden').addClass('overflow-communicate').attr('ht', overflowheight);
			$(this).parent().append('<div class="center overflow-informer"><span class="toggle-down-wide overflow-actionbutton"></span></div>');//csi-iconfont csi-down-wide
			$(this).parent().children('.overflow-informer').on("click", function () {
				overflowToggle(this);
			});
		}
	});
	//show/hide back to top tab
	$(window).scroll(function () {
		if ($(this).scrollTop() > 300) {
			$('#topper').fadeIn();
		} else {
			$('#topper').fadeOut();
		}
	});
	$("#_lAs").on("click", function (event) {
		event.preventDefault();
		laInterface();
	});

	// Fix for TinyMCE dialogs not being able to get focus to dialogs
	$(document).on('focusin', function (e) {
		if ($(e.target).closest(".mce-window").length) {
			e.stopImmediatePropagation();
		}
	});

	// initCartFuncs();
	setPageMenu();
	loadScrollAnchors();
	summarySections();
});

function setLocalTime() {
	if (storageAvailable("sessionStorage")) {
		if (!sessionStorage.UTCOffset) {
			sessionStorage.UTCOffset = setUTCOffset();
		}
	}
}

function setUTCOffset() {
	var offset = new Date().getTimezoneOffset();
	$.ajax({
		type: "POST",
		data: { utcoffset: offset },
		url: "/actions/misc.cfc?method=setUTCOffset"
	});
	return offset;
}

function storageAvailable(type) {
	try {
		var storage = window[type],
			x = '__storage_test__';
		storage.setItem(x, x);
		storage.removeItem(x);
		return true;
	}
	catch(e) {
		return false;
	}
}

function isAndroid(){
	return /android/i.test(navigator.userAgent.toLowerCase());
}

function summarySections(){
	$(".fullText").toggleClass('summaryText');
	$(".link").bind("click",function(){
		$("#"+$(this).attr("role")).toggleClass('summaryText');
	});
}

function loadScrollAnchors(){
	$('a[href^="#"]').on('click',function (e) {
		e.preventDefault();
		var adjust = headerAdjustment();
		var target = this.hash;
		if(target.search('/') == -1){
			var $target = $(target);
			if($target.offset()){
				scrollToTarget($target.offset().top-adjust);
			};
		}
	});
	initOrderBox();
}

function headerAdjustment(){
	return $('#pagenav').hasClass("affix")==true ? $('#top-nav').height() + 52:$('#top-nav').height() + $('#pagenav').height() + 72;//if the page header is affixed to the top, we have to adjust differently
}

function scrollToTarget(t){
	$('html, body').stop().animate({
		'scrollTop': t
	}, 1500, 'easeOutQuart');
}

function setPageMenu(){
	if($('#pagenav').offset() != undefined){
		$('#pagenav').on('affix.bs.affix', function () {
			$('#navBrand').html('');//<img src="https://s.campbellsci.com/images/1-#images.id[1]#.png" />
			$('#navBrand').fadeIn();
			$('.cta2').html($('#cta').html());
			$('#fullmenu').hide();
			$('#smallmenu').removeClass("hidden-lg hidden-md hidden-sm");
		});
		$('#pagenav').on('affixed-top.bs.affix', function () {
			$('#navBrand').html('');
			$('.cta2').html('');
			$('#fullmenu').show();
			$('#smallmenu').addClass("hidden-lg hidden-md hidden-sm");
		});
		$('#pagenav').affix({
			offset: {
			top: $('#pagenav').offset().top-60}
		});
	}
}

function trackEvent(info) {
	var i = [];
	var i = info.split("|");
	i[1] = i[1] || "";
	i[2] = i[2] || "";
	i[3] = i[3] || "";
	window.dataLayer.push({
		"event": "gaTriggerEvent",
		"gaEventCategory": i[0],
		"gaEventAction": i[1],
		"gaEventLabel": i[2],
		"gaEventValue": i[3]
	});
}

function trackPageview(src, pTitle){
	window.dataLayer.push({
		"event": "virtualPageview",
		"virtualPageURL": src,
		"virtualPageTitle": pTitle || null
	});
}

function set_Cookie(cname, cvalue, exdays){
	var d = new Date();
	d.setTime(d.getTime()+(exdays*24*60*60*1000));
	var expires = "expires="+d.toGMTString();
	document.cookie = cname + "=" + cvalue + "; " + expires;
}

function get_Cookie(name){
    var pattern = RegExp(name + "=.[^;]*");
    var matched = document.cookie.match(pattern);
    if(matched){
        var cookie = matched[0].split('=');
        return cookie[1];
    }
    return false;
}

function home_flash(index,bypass){//array positions: 0: record id, 1: bar text, 2: click URL, 3: main image id,4:main img extension, 5: secondary image,6:duration, 7: video ID, 8: area id(s)
//	imgarray = 	splashImages[index];
	//get the next image ready
	fadeTimer = 1;
	if(bypass == 1){
		fadeTimer = 0;
	}
	if(playHFlash || bypass == 1){//is it paused?
		$('#homeFlashBox').css('background-image','url('+('https:' == document.location.protocol ? 'https://campbellsci-res.cloudinary.com/image/upload/' : 'https://campbellsci-res.cloudinary.com/image/upload/')+splashImages[index][3]+')');
		//$('#imgp_2').css('background-image','url('+('https:' == document.location.protocol ? 'https://s.campbellsci.com/images/' : 'https://s.campbellsci.com/images/')+'6-'+splashImages[index][5]+'.png)');
		$('#vidClickArea').remove();

		nextfade = setTimeout(function(){
			if(bypass != 1){
			$('#homeFlashBoxTextBar').fadeTo(200*fadeTimer,0);
			}
			//$('#homeFlashTitle').fadeTo(250,0);
		//	$('#homeFlashText').fadeTo(250,0);
			$('#homeFlashBox2').fadeTo(500*fadeTimer,0,function(){//start fading the current visible
				if(playHFlash || bypass == 1){//make sure we still want to
					var subImg = "";
					if(splashImages[index][5] != ''){
						$('#homeFlashProd').attr('src','https://campbellsci-res.cloudinary.com/image/upload/w_300,h_300,c_limit/'+splashImages[index][5]+".png");
						$('#homeFlashProd').fadeTo(250*fadeTimer,1);
					}else{
						$('#homeFlashProd').fadeTo(150,0);
					};
					if(splashImages[index][12] == 0){//change bar color
						$('#homeFlashBoxTextBar').css('backgroundColor','rgba(0, 0, 0, 0.5)');
					}else{//this one is blue
						$('#homeFlashBoxTextBar').css('backgroundColor','rgb(2, 108, 182,.65)');
					}
					if(splashImages[index][2] != ''){//check to see if this has a url to go to
						$('#homeFlashClickBox').attr('href','/'+splashImages[index][2]);
					}else{
						$('#homeFlashClickBox').attr('href','/');
					};
					$(this).html(subImg);
					$('#homeFlashTitle').html(splashImages[index][11]);
					$('#homeFlashText').html(splashImages[index][1]);
					setTimeout(function(){$('#homeFlashBoxTextBar').fadeTo(1000*fadeTimer,1);},400);
				}

				if(playHFlash){//keep it running if still true
					setTimeout(function(){
						$('#homeFlashBox2').css('background-image','url('+('https:' == document.location.protocol ? 'https://campbellsci-res.cloudinary.com/image/upload/' : 'https://campbellsci-res.cloudinary.com/image/upload/')+splashImages[index][3]+')');
						$('#homeFlashBox2').fadeTo(0,1);
						index++;
						if(index >= splashImages.length){index = 0;}
						flashIndex = index;
						home_flash(index);
					},splashImages[index][6]*1000);
				}

			});

		},100);
	}
//alert('ran');
}

function stopFlash(){
	playHFlash = 0;
}

function flashPrevious(){
	stopFlash();
	flashIndex--;
	if(flashIndex < 0){flashIndex = splashImages.length-1;}
	home_flash(flashIndex,1)
}

function flashNext(){
	stopFlash();
	flashIndex++;
	if(flashIndex >= splashImages.length){flashIndex = 0;}
	home_flash(flashIndex,1)
}

function emptyCall(){
	var nothing = 0;
}

function emptyCall2(){
	$("a:eq(35)").focus();
	var nothing = 0;
}

function loadContentpopup(rel){//expects vars in this format: id:36|title:Ask an Expert|a:2 --requires component id and title, other vars optional
	crsr('wait');
	var str = rel.replace(/\|/g,'","');
	var str = str.replace(/:/g,'":"');
	var str = '{"' + str + '"}';
	var data = jQuery.parseJSON(str);
	var qstr = $.param(data, true);
	var boxWidth = data.width || 'auto';
	$('#page_content').append('<div id="contentpop" class=""></div>');
	$.ajax({
		url: "/actions/misc.cfc?method=loadComponent",//if url.p isdefined, popup is loaded
		type: "POST",
		data: data,
		dataType: "html",
		success: function(html){
			$('#contentpop').html(html);
			$('#contentpop').dialog({
				title: data.title, position: { collision: "none", at: "top center" }, stack: true, modal: true, dialogClass: "dialog", width: boxWidth, height: 'auto', beforeClose: function () {
					if(typeof tinyMCE !== "undefined") tinyMCE.remove();
					$('#contentpop').dialog('destroy').remove();
				}, open: function () {
					$(".close-dialog").on("click", function () {
						$("#contentpop").dialog("close");
					})
				}
			});
			simpletiny();
		//	$('#contentpop').dialog({title:data.title,stackable:true,modal:true,position:'center',height:'auto',width:'auto',beforeClose:function(){$('#contentpop').dialog('destroy').remove();}});
			crsr('default');
		},
		error: function(){
			$('#contentpop').dialog({title:'Error',position:{collision:"none",at:"top center"},beforeClose:$('#helpbox').remove()});
			$('#contentpop').html("There was an error.");
			crsr('default');
		}
	});
}

function crsr(what){
	document.body.style.cursor=what;
}

//validation for email addresses***********************************************************************************
function isEmail(str) {
  //return (str.indexOf(".") > 2) && (str.indexOf("@") > 0);
  var r1 = new RegExp("(@.*@)|(\\.\\.)|(@\\.)|(^\\.)");
  var r2 = new RegExp("^.+\\@(\\[?)[a-zA-Z0-9\\-\\.]+\\.([a-zA-Z]{2,3}|[0-9]{1,3})(\\]?)$");
  return (!r1.test(str) && r2.test(str));
}

//http://www.expertsforge.com/Web-Development/Tutorial-217.asp
function Left(str, n){
   if (n <= 0)
         return "";
   else if (n > String(str).length)
         return str;
   else
         return String(str).substring(0,n);
}

function kill_tiny_mces(){
	$('.mceIframeContainer iframe').each(function(){
		tinyMCE.remove();
		//tinyMCE.execCommand('mceRemoveControl', false, this.id);
	});
}

function kill_tiny_mces2(){
	tinytokill = document.getElementsByTagName("iframe");
	if(tinytokill.length > 2){
		for(i=2;i<=tinytokill.length;i++){
				tinyMCE.execCommand('mceRemoveControl', false, Left(tinytokill.item(0).id,tinytokill.item(0).id.length-4));
		}
	kill_tiny_mces2()
	}
}

function dumpProps(obj, parent) {
   // Go through all the properties of the passed-in object
   for (var i in obj) {
      // if a parent (2nd parameter) was passed in, then use that to
      // build the message. Message includes i (the object's property name)
      // then the object's property value on a new line
      if (parent) { var msg = parent + "." + i + "\n" + obj[i]; } else { var msg = i + "\n" + obj[i]; }
      // Display the message. If the user clicks "OK", then continue. If they
      // click "CANCEL" then quit this level of recursion
      if (!confirm(msg)) { return; }
      // If this property (i) is an object, then recursively process the object
      if (typeof obj[i] == "object") {
         if (parent) { dumpProps(obj[i], parent + "." + i); } else { dumpProps(obj[i], i); }
      }
   }
}

function myCustomOnChangeHandler(inst) {
	tinyMCE.triggerSave(false,true);
}

function inittiny(ht){
	setTimeout(function(){
		$( ".date_selector" ).datepicker({
			//create: function(event, ui) { ... }
		});

		var h = (!ht)?'400px':ht;
		$('.tiny_area').tinymce({
			// Location of TinyMCE script
			//  script_url : '/gu/scripts/tiny_mce/tiny_mce.js',
			theme : "modern",
			//mode : "specific_textareas",
			selector : "tiny_area",
			onchange_callback : "myCustomOnChangeHandler",
			menubar: false,
			convert_urls: false,
			statusbar: false,
			plugins : ["table fullscreen contextmenu paste image link autolink code charmap spellchecker autoresize videolink wordcount"],
			dialog_type : "modal",
			toolbar: "bold italic underline | bullist numlist | link unlink image | table charmap | code fullscreen | videolink | saveButton",
			toolbar_items_size: 'small',
			image_advtab: true,
			valid_elements : "*[*]",
			invalid_elements : "pre",
			autoresize_bottom_margin: 25,
			autoresize_max_height: 600,
			//paste_preprocess : "convertWord",
			paste_word_valid_elements: "",
			setup : function(ed) {
				var item;
				ed.addButton('saveButton', {
					text: 'Save',
					icon: false,
					classes: "saver",
					onclick: function () {
						ed.save();
						item = ed.getElement();
						$(item).trigger("change");
						$(ed.getContainer()).css("border-color","#ccc").find("div.mce-saver button").css({"color":"black", "text-transform":"capitalize"});
					}
				});
				ed.on("change", function(){
					$(ed.getContainer()).css("border-color","red").find("div.mce-saver button").css({"color":"red", "text-transform":"uppercase"});
				});
				ed.on('keyup', function (e) {
					var curLeng = tinyMCE.get(this.id).getContent();
					$('#'+this.id+'_len').html($(curLeng).text().length);
				});

			}
		})
		$.widget("ui.dialog", $.ui.dialog, {
			_allowInteraction: function(event) {
				return !!$(event.target).closest(".mce-container").length || this._super( event );
			}
		});
	},500);
}

function userTinyInit() {
	if (typeof tinymce !== "undefined") {
		tinymce.init({
			selector: ".tinyUserArea",
			valid_elements : "a[href|target=_blank],strong/b,br,i/em,p",
			plugins: [
			   "link paste"
			],
			toolbar: "bold italic link",
			paste_as_text: true,
			menubar: false,
			statusbar: false,
			toolbar_items_size: 'small'
		 });
	}
}

function convertWord(type, content) {
	switch (type) {
		// Gets executed before the built in logic performes it's cleanups
		case "before":
			//content = content.toLowerCase(); // Some dummy logic
			break;

		// Gets executed after the built in logic performes it's cleanups
		case "after":
			//content = content.toLowerCase(); // Some dummy logic
			break;
	}

	return content;
}

function inittiny2() {
	var w = $("body").width() - 80;
	tinyMCE.init({
		theme : "advanced",
		mode : "specific_textareas",
		editor_selector : "hist_tiny_area",
		onchange_callback : "myCustomOnChangeHandler",
		plugins : "table,fullscreen,emotions,contextmenu,inlinepopups",
		dialog_type : "modal",
		theme_advanced_buttons1 : "bold,italic,underline,format,separator,bullist,numlist,separator,link,unlink,separator,table,hr,charmap,h1,separator,code,fullscreen",
		theme_advanced_buttons2 : "",
		theme_advanced_buttons3 : "",
		theme_advanced_toolbar_location : "top",
		theme_advanced_toolbar_align : "center",
		valid_elements : "a[href],strong/b,em/i,br,p[*],table[border=0|cellspacing|cellpadding|width|height|class|align|summary|style|dir|id|lang|bgcolor|background|bordercolor],tr[id|lang|dir|class|rowspan|width|height|align|valign|style|bgcolor|background|bordercolor],tbody[id|class],thead[id|class],tfoot[id|class],td[id|lang|dir|class|colspan|rowspan|width|height|align|valign|style|bgcolor|background|bordercolor|scope],th[id|lang|dir|class|colspan|rowspan|width|height|align|valign|style|scope],li,ol,ul,strike,img[src|height|width|style],h2[style],h3[style],input[*],form[*],div[*],button[*],object[*],param[*],embed[*]",
		invalid_elements: "pre",
		code_dialog_width:w,
		   fullscreen_settings : {
			theme_advanced_buttons1 : "bold,italic,underline,format,bullist,numlist,link,unlink,tablecontrols,hr,charmap,emotions,code,fullscreen",
			paste_create_paragraphs : true,
			paste_create_linebreaks : true,
			paste_use_dialog : true,
			paste_auto_cleanup_on_paste : true,
			paste_convert_middot_lists : false,
			paste_unindented_list_class : "unindentedList",
			paste_convert_headers_to_strong : false,
			paste_remove_styles : true,
			paste_insert_word_content_callback : "convertWord",
			paste_strip_class_attributes: "all"
		}
	});

}

function simpletiny(){
	if (typeof tinymce !== "undefined") {
		tinymce.init({
			selector: ".tinyArea",
			valid_elements: "a[href|target=_blank],strong/b,br,i/em,p",
			plugins: [
				"link paste"
			],
			toolbar: "bold italic link",
			paste_as_text: true,
			menubar: false,
			statusbar: false,
			toolbar_items_size: 'small'
		});
	}
}

function elmLoop(formm,ajax_nme,showunchecked){
	var onname = '';
	valstring = ajax_nme;
	theForm = document[formm];

	if(theForm.elements == undefined){
		return false;
	}
	for(i=0; i<theForm.elements.length; i++){
		var alertText = ""

		if(theForm.elements[i].type == "text" || theForm.elements[i].type == "textarea" || theForm.elements[i].type == "button"){
			if(theForm.elements[i].value != ''){
				valstring = valstring+'&'+theForm.elements[i].name+'='+ theForm.elements[i].value;
			}else{
				if(theForm.elements[i].title.length > 0){
					alert(theForm.elements[i].title);
				}else{
					alert('Please provide the requested information');
				}
				theForm.elements[i].focus();
				return false;
			}
		}
		else if(theForm.elements[i].type == "password"){
			if(theForm.elements[i].value == ''){
				if(theForm.elements[i].title.length > 0){
					alert(theForm.elements[i].title);
				}else{
					alert('Please provide the requested information');
				}
				theForm.elements[i].focus();
				return false;
			}
			valstring = valstring+'&'+theForm.elements[i].name+'='+ theForm.elements[i].value;
		}
		else if(theForm.elements[i].type == "hidden"){
		valstring = valstring+'&'+theForm.elements[i].name+'='+ theForm.elements[i].value;
		}
		else if(theForm.elements[i].type == "checkbox" || theForm.elements[i].type == "radio"){
			if(showunchecked != 1){
				if(theForm.elements[i].checked == true){
					if(onname != theForm.elements[i].name){
						onname = theForm.elements[i].name;
						valstring = valstring+'&'+theForm.elements[i].name+'='+ theForm.elements[i].value;
					}else{
						valstring = valstring +','+ theForm.elements[i].value;
					}
				}
			}else{
				if(onname != theForm.elements[i].name){
					onname = theForm.elements[i].name;
					valstring = valstring+'&'+theForm.elements[i].name+'='+ theForm.elements[i].checked;
				}else{
					valstring = valstring +','+ theForm.elements[i].checked;
				}
			}
		}else if(theForm.elements[i].type == "select-one"){
			valstring = valstring +'^'+ theForm.elements[i].options[theForm.elements[i].selectedIndex].text;
		}
	}
	return valstring;
}

function position_pop(){//can probably go away
	divid = mdiv;
	divwidth = document.getElementById(divid).offsetWidth;
	windowwidth = window.innerWidth;
	leftit = windowwidth-divwidth;
	if(isNaN(leftit) == false){
		document.getElementById(divid).style.left=leftit*.5+'px';
		divheight = document.getElementById(divid).offsetHeight;
		windowheight = window.innerHeight;
		topit = windowheight-divheight;
		if(topit >= 0){
			document.getElementById(divid).style.top =topit*.5+window.pageYOffset+'px';
			//document.getElementById(divid).style.top ='90px';
		}else{
			document.getElementById(divid).style.top = '60px';
		}
	}else{
		windowwidth = $(window).width();
		leftit = windowwidth-divwidth;
		document.getElementById(divid).style.left=leftit*.5+'px';
		divheight = document.getElementById(divid).offsetHeight;
		windowheight = $(window).height();
		topit = windowheight-divheight;
		document.getElementById(divid).style.top = '60px';
	}
	document.getElementById(mdiv).style.visibility = 'visible';
}

function move_it(div,speed){
	if(speed == undefined){
		speed = 300;
	}
	if(div == undefined){
		div = 'blank_reciever';
	}
	mdiv = div;
	//document.getElementById(mdiv).style.visibility = 'hidden';
	setTimeout('position_pop();',speed);
}

function showImage(img){
	var imgID = img.id.split("-")[1];
	var imgExt = $('#'+img.id).attr('ext');
	var caption = img.title;
	$("#ig-image").html('<img src="'+('https:' == document.location.protocol ? 'https://campbellsci-res.cloudinary.com/image/upload/w_600,h_600,c_limit/' : 'https://campbellsci-res.cloudinary.com/image/upload/w_600,h_600,c_limit/')+imgID+'.png">');
	$("#ig-caption").html(caption);
}

function close_pop(){
	$('#popdiv').fadeTo(100,0.1);
	$('#popback').fadeTo(250,0.1,function(){
		if(jQuery.browser.version == 6.0 && jQuery.browser.msie == true){
			$('body').css({'width':'','height':''});
		}
		$('#popback').remove();
		$('#popdiv').remove();
	});
}

function default_prod_view(viewid,hideafter,noReload){
	$.post("/actions/misc.cfc?method=setDefaultProdView", { viewid:viewid },
	function(data){
		$('#ptabPref').fadeToggle(50);
		if(noReload != 1){
			reload_content();
		}
		setTimeout(function(){
			$('#ptabPref').fadeToggle(500);
		},1000);
	});
}

//add to downloadlist
function add_download(dlid){
	$.post("action.cfm", { vars: "add_download",download:dlid },
	function(data){
		//tmpvar = $('.prod_info_box').html();
		$('.quick_quote_links')
		$('#add_dl_'+dlid).html('view download list').attr({'href':'/19_2_0','onclick':''});
	});
	return false;
}

//new product component display for case studies, rotates through them
function fade_cs(show,playcs){
	if(show > maxcs){
		show = maxcs;
	}else if(show < 1){
		show = 1;
	}
	if(show <= maxcs && show > 0){
		for(i=1;i<=maxcs+1;i=i+1){
			$('#cs_'+i).fadeOut(0);
		}
		fadenext = oncur+1;

		$('#cs_'+oncur).fadeOut(200);
		$('#cs_'+show).fadeIn(400);
		$('#cs_'+fadenext).fadeIn(400);
		oncur = show*1;
		change_cs_navbuttons(show);
		if(playcs == 1 && playcsvar == 1){
			setTimeout('cs_rotater()',10000);
		}else{
			playcsvar = 0;
		}
	}
}

//oct 8th open user preferences window
function open_user_preferences(){
	$('body').append('<div id="contentpop" class="popbox"></div>');
	$.post("/actions/misc.cfc?method=userPrefs",
	function(data){
		$("#contentpop").html(data);
		$("#contentpop").append('<button class="btn btn-md btn-primary pull-right" id="saveprefs">Save</button>');
		$('#contentpop').dialog({
			title:'Preferences',
			stackable:true,
			modal:true,
			position:{
				collision:"none",
				at:"top center"
			},
			height:'auto',
			width:640,
			beforeClose:function(){
				//$('#contentpop').dialog('destroy').remove();reload_content();
				window.location.reload();
			}});
		$('#saveprefs').click(function() {$('#contentpop').dialog("close");});
	});
}

// change any cookie oct 9th
function setDetailView(cookiename, newvalue){
	$.post("/actions/misc.cfc?method=setDetailViewPref", { cookie:cookiename, val:newvalue},
	function(data){
		$('#pdetailPref').fadeToggle(50);
		setTimeout(function(){
			$('#pdetailPref').fadeToggle(500);
		},1000);
	});
}

function change_pc(col,newvalue,noReload){
	$.post("/actions/cart.cfc?method=changePC", {val:newvalue,col:col},
	function(data){
		$('#ppricePref').fadeToggle(50);
		if(noReload != 1){
			reload_content();
		}
		setTimeout(function(){
			$('#ppricePref').fadeToggle(500);
		},1000);
	});
}

//validation for email addresses***********************************************************************************
function isEmail(str) {
  //return (str.indexOf(".") > 2) && (str.indexOf("@") > 0);
  var r1 = new RegExp("(@.*@)|(\\.\\.)|(@\\.)|(^\\.)");
  var r2 = new RegExp("^.+\\@(\\[?)[a-zA-Z0-9\\-\\.]+\\.([a-zA-Z]{2,3}|[0-9]{1,3})(\\]?)$");
  return (!r1.test(str) && r2.test(str));
}

function ajax_send_postconfirm(id){
	$.post("/forum/newposts.cfm", {messages:id,onlyone:1},
	function(data){
		document.body.style.cursor="default";
		$('#'+id+'_confbtn').style.display='none';
		$('#'+id+'_unreviewed').style.backgroundColor='##FFFFFF';
	});
}

function reload_content(callback){
		$.post("/actions/misc.cfc?method=reloadContent", { data:pageVarStruct},
		   function(data){
		 	$('#page_content').html(data);
			setPageMenu();
		 	$('.locadmindiv').bind('click', function(){cmsCall('load_componentadmin',$(this).parent().attr('rel')+'|'+pagevars);setTimeout(function(){inittiny(400)},500);});
		 	if(typeof callback === "function"){
		 		callback();
		 	}
	   });
}

function close_pop2(){
	$('#popdiv').fadeTo(100,0.1);
	$('#popback').fadeTo(250,0.1,function(){
		if(jQuery.browser.version == 6.0 && jQuery.browser.msie == true){
			$('body').css({'width':'','height':''});
		}
		$('#popback').remove();
		$('#popdiv').remove();
	});
}

function convert_unit(from, to, theVal, typeId, rnd){
	if(isNaN(theVal)==false){
		$.post("/actions/misc.cfc?method=convert_units", {fromId:from, toId:to, val:theVal, scale:rnd},
			function(data){
				var result = data;
				$("#val_2_"+typeId).val(result.NEWVALUE);
			});
	} else {
		$("#val_2_"+typeId).val('please enter a number');
	}
}

function swapUnitType(unitType){
	$("#unitsHolder").load("/actions/misc.cfc?method=swapUnitType", {typeid:unitType});
}

/*
 * Used for creating a modified jquery ui dialog box for displaying videos
 * Can be any element that has a class of "play-video"  +
 * a rel attribute like: rel="youtube|KN9WD74UfZk", rel="swf|10.swf"
 */
var VideoDialog = (function($){
	var init = function(){
		$(document).on("click", ".play-video", function(event){
			event.preventDefault();
			var id = this.id.split("-")[1];
			var rel = $(this).attr("rel").split("|");
			var type = rel[0];
			var video = rel[1];
			var params = "?autohide=2";
			if(type == 'youtube'){
				//start
				if(rel.length > 2){
					params = params + ((rel[2].length) ? "&start=" + rel[2] : "");
				}
				//end
				if(rel.length > 3){
					params = params + ((rel[3].length) ? "&end=" + rel[3] : "");
				}
				//autoplay
				if(rel.length > 4){
					params = params + ((rel[4].length && rel[4]) ? "&autoplay=1" : "&autoplay=0");
				}
				//YouTube
				var $d = makeDialog();
				$d.html('<iframe width="854" height="480" src="//www.youtube.com/embed/'+video+params+'&rel=0" frameborder="0" allowfullscreen></iframe>');
			} else {
				var $d = makeDialog(600, 800);
				$d.html('<object width="760" height="560">\
							<param name="SRC" value="https://s.campbellsci.com/files/videos/'+video+'">\
							<embed src="https://s.campbellsci.com/files/videos/'+video+'" width="760" height="560"></embed>\
							<param name="controller" value="true" />\
							<param name="autoplay" value="true" />\
							<param name="autostart" value="true" />\
						</object>');
			}
			//$(".v-dialog").append('<span id="vd-close">x</span>')
			//	.delegate("#vd-close", "click", function(){
			//		killDialog();
			//	});
		});
	},
	makeDialog = function(h, w){
		var dialog = "<div id='video-dialog'></div>";
		$("body").append(dialog);
		var $d = $("#video-dialog");
		$d.dialog({
			dialogClass: "v-dialog",
			height: h || 550,
			width: w || 890,
			modal: true,
			show: "fade",
			position:{collision:"none",at:"top center"},
			resizable: false,
			close: function(){
				killDialog();
			},
			open: function(){
				$(".ui-widget-overlay").bind("click", function(){
					killDialog();
				});
			}
		})
		return $d;
	},
	killDialog = function(){
		$("#video-dialog").dialog("destroy").remove();
	}
	//initialize
	init();
})(jQuery);

// JavaScript Document
function hide_it(id){
	$('#'+id).style.display = 'none';
}

function updateCartCount(num){
	var n = num || 0;
	if(n > 99){
		n = num + "<sup>+</sup>";
	}
	$("#c-count").html(n).addClass("badge");
}

function initOrgSwitcher(){
	$("body").on("click", "#orgswitcher li a", function(event){
		event.preventDefault();
		var val = $(this).attr("rel");
		crsr("wait");
		$.ajax({
			type:"post",
			url:"/actions/cart.cfc?method=checkForCartSection",
			data:{section:'subscriptions'},
			success: function(data){
				var result = data;
				if(result.idx > 0){
					var r = confirm("If you change organizations, all subscription renewals will be removed from the cart. Would you like to continue?");
					if (r == true) {
						switchOrg(val);
					}
					else{
						crsr("default");
					}
				}
				else {
					switchOrg(val);
				}
			}
		});
	});
}

function switchOrg(id){
	$.ajax({
		type:"post",
		url:"/actions/cart.cfc?method=changeOrg",
		data:{custid:id},
		success: function(data){
			var result = data;
			if(result.status == 200){
				location.reload();
			}
		}
	});
}

function toggleDetails(tr, type, show){
	var $this = tr;
	var details = $this.next("tr").find("div.idetail");
	details.find("p.alert").removeClass("alert-success alert-danger alert-warning alert-info").addClass(type);
	if(show === true && details.is(":hidden")){
		$this.parents("tbody").find("a.toggle-detail").trigger("click");
	} else if(show === false && !details.is(":hidden")){
		$this.parents("tbody").find("a.toggle-detail").trigger("click");
	}

}

function updateInfo(box){
	var done = canAdd(box);
	var $opts = box.find("table.optTable");
	var oInfo = $opts.data("info").split("|");
	var config = getConfigOpts($opts);
	if (done) {
		$.ajax({
			type: "POST",
			url: "/actions/cart.cfc?method=getProdInfo",
			data: {
				model: oInfo[0],
				part: oInfo[1],
				plist: config.parts,
				prefix: oInfo[2],
				config: config.config,
				configured: done,
				prodcon: config.prodcon
			},
			success: function(res) {
				var result = res;
				//box.find("tr.prow").addClass("highlight");
				box.find(".pconfig").html(result.configuration);
				box.find("div.pricer.one").not(".noshow").html(result.price1);
				box.find("div.pricer.two").not(".noshow").html(result.price2);
				// setTimeout(function(){
				// 	box.find("tr.prow").removeClass("highlight");
				// }, 500);
			}
		});
	}
}

function canAdd(prodBox){
	var can = true;
	prodBox.find(":text:visible").each(function(){
		if (!$(this).val().length) {
			can = false;
		}
	});
	return can;
}

//CART FUNCTIONS
function initOrderBox() {
	$("body")
		//Add to cart action
		.on("click", "div.orderBox div.prodBox button.add-item", function(event){
			event.preventDefault();
			var $this = $(this);
			var $box = $this.parents("div.box");
			var okToAdd = canAdd($box);
			if (okToAdd) {
				document.body.style.cursor="wait";
				var pstring = $(this).attr("id");
				var pid = pstring.split("-")[1];

				addToCart($box, pid);

			} else { //Don't allow Add - need input
				showNeedOptions($box);
			}

		})
		// Enable/disable sub-options
		.on("change", "div.orderBox div.prodBox input:radio", function (event) {
			var $this = $(this);
			var $optTable = $this.parents("table");
			var tbody = $this.parents("tbody");
			var opt = $this.data("optid");
			var group = tbody.data("group");

			// hide all sub-group options for group selected - recursive
			hideSubItems($optTable, group);

			//show sub-group options for selected option
			$optTable.find("tbody[data-parent='" + opt + "']").each(function () {
				$(this).find("td input:radio:checked").trigger("change");
			}).removeClass("hide");
			// update config & price
			updateInfo($(this).parents("div.box"));

		}).on("click", "div.orderBox div.prodBox table.optTable tr.opt:not(.disabled)", function(event){
			if (event.target.nodeName !== "INPUT"){
				$(this).find("td input:radio").prop("checked", true).trigger("change");
				$(this).find("td input:text").focus();
			}
		}).on("change", "div.orderBox div.prodBox input[type=text]", function(event){
			var $this = $(this);
			var min = $this.data("min");
			var max = $this.data("max");
			var step = $this.data("step");
			if (event.type == "change" || event.keyCode == 13) {
				var val = $.trim($this.val());
				var v = parseInt(val);
				//not a number or no input
				if (val.length === 0 // nothing
					|| isNaN(val)  // not a number
					|| !((typeof v === 'number') && (val % 1 === 0)) // not an integer
					|| v < min // smaller than minimum
					|| v > max // larger than max
					|| (v % step !== 0) // not right increment
					|| val.match(/\D/) !== null // non-numeric characters - including period
				) {
					$this.val("");
					toggleDetails($this.parents("tr.opt"), "alert-danger", true);
					//ok
					flagInput($this, false);
					//update config & price
					updateInfo($(this).parents("div.box"));
				} else { //valid!
					//ok
					$this.val(v);
					flagInput($this, true);
					updateInfo($(this).parents("div.box"));
					toggleDetails($this.parents("tr.opt"), "alert-success");
				}
			}
		});

	function hideSubItems($optTable, group) {
		$optTable.find("tbody[data-parentgroup='" + group + "']").each(function () {
			var $tbody = $(this);
			$tbody.find(":input:radio").each(function () {
				$(this).prop("checked", true);
				return false;
			});
			$tbody.find(":input:text").val("");
			// get option ids, loop and find groups, and recurse
			$tbody.find("tr.opt").each(function () {
				var optionId = $(this).data("optid");
				$optTable.find("tbody[data-parent='" + optionId + "']").each(function () {
					hideSubItems($optTable, $(this).data("parentgroup"));
				});
				toggleDetails($(this), "alert-info", false);
			});
		}).addClass("hide");
}
	//show Pricing Preferences
	$("body").on("click", "a.prefs", function(event){
		event.preventDefault();
		event.stopPropagation();
		open_user_preferences();
	});

	//expand collapse details
	$("body")
	.on("click", "div.orderBox a.toggle-detail", function(event){
		event.preventDefault();
		$this = $(this);
		if ($this.hasClass("od")) {
			$this.parents("tbody").find("div.idetail").toggleClass("hide");//slideToggle not working?
		} else {
			$this.parents("div.infocont").find("div.idetail").toggleClass("hide");
		}
		var txt = $.trim($this.text());
		var ttxt = $this.data("ttext");
		$this.find("span:first-child").text(ttxt);
		$this.data("ttext", txt);
		$this.find("span.ui-icon").toggleClass("ui-icon-triangle-1-n ui-icon-triangle-1-s");
	});

	$("body").on("click", "a.qtydiscount", function(event){
		event.preventDefault();
		var $this = $(this);
		var pInfo = $this.attr("id").split("|");
		var config = $.trim($("div.prodBox").find(".prod-config span").html());
		showQuantityDiscount($this.data("title"), $this.data("btnclose"),  pInfo[0], pInfo[1], config, pInfo[2]);
	});

	//ships within note dialog
	$("a.shipWithin").on("click", function(event){
		event.preventDefault();
		var btnClose = $("#shipWithinDialog").data("btnclose");
		$("#shipWithinDialog").dialog({
			modal:true,
			height:420,
			width:420,
			buttons:[
				{ text: btnClose, click: function(){$(this).dialog( "close" );}}
			]
		});
	});

	initOrgSwitcher();
}

function addToCart($box, pid, systype) {

	//construct config options
	var config = getConfigOpts($box.find("div.opts table.optTable tbody"));

	//send to addToCart
	$.ajax({
		type: "POST",
		data: {
			id: pid,
			configuration: config.config,
			plist: config.parts,
			prodcon: config.prodcon,
			type: systype
		},
		url: "/actions/cart.cfc?method=addToCart",
		success: function(res) {
			document.body.style.cursor = "default";
			var result = res;
			if (result.status === 200) {
				showAdded($box);
				updateCartCount(result.count);
			} else if (result.status === 500) {
				$('body').append('<div id="badProduct" class="popbox"></div>');
				$('#badProduct').html(result.msg);
				$('#badProduct').dialog({
					title: result.title,
					stackable: true,
					modal: true,
					height: 'auto',
					position:{collision:"none",at:"center center"},
					width: 420,
					height: 260,
					beforeClose: function() {
						$('#badProduct').dialog('destroy').remove();
					},
					buttons: [{
						text: result.btnok,
						click: function() {
							$(this).dialog("close");
						}
					}]
				});
			}

		}

	});

}

function showNeedOptions(prodBox){
	var count = 1;
	prodBox.find("input:text:visible").each(function(){
		if (!$(this).val().length) {
			if(count === 1){$(this).focus()};
			flagInput($(this), false);
			toggleDetails($(this).parents("tr"), "alert-danger", true);
			count++;
		}
	});
}

function showQuantityDiscount(title, close, model, part, config, plist){
	$.ajax({
		type:"post",
		url:"/actions/cart.cfc?method=getQtyDiscountChart",
		data:{model:model, part:part, config:config, plist:plist},
		success:function(data){
			$('body').append('<div id="qty-discount-box" class="popbox"></div>');
			var discBox = $("#qty-discount-box").dialog({
				height:350, width:320,
				title:title,
				modal:true,
				buttons:[
					{ text: close, click: function(){$(this).dialog( "close" );}}
				],
				beforeClose:function(){
					$(this).dialog('destroy').remove();
				}
			});
			discBox.html(data);
		}
	});
}

// function initCartFuncs() {
// 	$("body")
	// .on("change", ".qtybox input, .qtybox input sysGroup", function(event) {
	// 	var $this = $(this);
	// 	var tr = $(this).parents("tr");
	// 	var cartItem = tr.attr("class");
	// 	var val = this.value;
	// 	if (isNaN(val) || val < 1) {
	// 		val = 1;
	// 	}
	// 	this.value = parseInt(val);
	// 	loadingDisplays(tr);//show spinners
	// 	$.ajax({
	// 		url: "/actions/cart.cfc?method=updateCartProductQuantity",
	// 		data: {
	// 			item: cartItem,
	// 			qty: this.value
	// 		},
	// 		success: function(data) {
	// 			refreshDisplays(data, tr);
	// 			var d = data;
	// 			$this.data("qty", d.quantity);
	// 			tr.find("a.update-qty").css({"visibility":"hidden"});
	// 		}
	// 	});
	// })
	// .on("keyup", ".qtybox input", function(event) {
	// 	 if(event.keyCode !== 13){
	// 		if (this.value != $(this).data("qty")) {
	// 			$(this).siblings("a.update-qty").css({"visibility":"visible"});
	// 		} else {
	// 			$(this).siblings("a.update-qty").css({"visibility":"hidden"});
	// 		}
	// 	 } else {
	// 	 	$(this).siblings("a.update-qty").css({"visibility":"hidden"});
	// 	 }
	// })
	// .on("click", "a.update-qty", function(event){
	// 	event.preventDefault();
	// 	$(this).hide();
	// })
	// .on("click", "a.cartRemover", function(event){ //This removes items from both the quick cart and the main cart page
	// 	event.preventDefault();
	//
	// 	var tr = $(this).parents("tr");
	// 	var cartItem = tr.attr("class");
	// 	$.post("/actions/cart.cfc?method=removeCartItem", { cartItem:cartItem },
	// 		function(data){
	// 			var d = data;
	// 			if (d.status === 200) {
	// 				updateCartCount(d.count);
	// 				updateCartTotal();
	//
	// 				if ($("table.cartTable")) {//main cart page
	// 					if ($("table.cartTable tbody tr").length === 1) {
	// 						reload_content();
	// 					} else {
	// 						var isStopper = (tr.parent("tbody").hasClass("no-order") || tr.parent("tbody").hasClass("no-order")) ? true : false;
	// 						if (isStopper) {
	// 							var reload = true;
	// 							var badCount = $("table.cartTable tbody.no-order").length + $("table.cartTable tbody.no-quote").length;
	// 							if (badCount > 1) {
	// 								reload = false;
	// 							}
	// 							if (reload) {
	// 								reload_content();
	// 								return false;
	// 							}
	// 						}
	// 						tr.fadeOut(400, function() {
	// 							tr.parent("tbody").remove();
	// 						});
	// 					}
	//
	// 				}
	//
	// 				if ($("#cartbox:visible")) {//quick cart is visible
	// 					if ($("#cartbox table tbody").length === 1) {
	// 						$("#cartbox table").html($("#empty-cart-msg table > tbody").clone());
	// 					} else {
	// 						tr.fadeOut(400, function() {
	// 							tr.parent("tbody").remove();
	// 						});
	// 					}
	// 				}
	// 			}
	// 		}
	// 	);
	// });
// }

function flagInput(inpt, valid){
	if(valid){
		inpt.removeClass("invalidInput").addClass("validInput");
	} else {
		inpt.removeClass("validInput").addClass("invalidInput");
		inpt.focus();
	}
}

function getConfigOpts($tbody){
	var opts = {
		config: [],
		parts: [],
		prodcon: []
	}
	$tbody.find("input:checked:visible, input[type='text']:visible, select:visible").each(function(){
		$this = $(this);
		var c = $this.data("config");
		var group = $this.data("group");
		var part = $this.data("part");
		var v = $this.val();
		if (!this.disabled) {
			opts.config.push(c + v);
			opts.prodcon.push("-(" + group + ")" + c.toString().replace("-", "") + v);
			if(part.toString().length){
				if(!v.toString().length){
					v = 1;
				}
				opts.parts.push(part+":"+v);
			}
		}
	});
	opts.prodcon = opts.prodcon.join("");
	opts.config = opts.config.join("");
	opts.parts = opts.parts.join(",");
	return opts;
}

// function closeEditCartItem(){
// 	$('#editCartItem').dialog('destroy').remove();
// }

function helpfulFAQ(faq,mode,obj){
	$.post("/actions/misc.cfc?method=faqvote", {mode:mode, faq:faq},
	function(data){
		if(mode == 'ups'){
			$('#thankYouText').html(data);
		}
	});
}

// function updateCartItem(prodid, oldItem){
// 	var $box = $("table[id^='p-"+prodid+"']");
// 	var okToAdd = canAdd($box);
// 	if (okToAdd) {
//
// 		var config = getConfigOpts($box);
// 		$.ajax({
// 			type:"post",
// 			url: "/actions/cart.cfc?method=updateCartItem",
// 			data: {
// 				id: prodid,
// 				configuration: config.config,
// 				plist: config.parts,
// 				prodcon: config.prodcon,
// 				oldconfig: oldItem
// 			},
// 			success: function(data) {
// 				var d = data;
// 				if (d.status === 200) {
// 					updateCartCount(d.count);
// 					reload_content(function() {
// 						closeEditCartItem();
// 						$("tr." + d.newc + " td:not(.pad)").effect("highlight", {
// 							color: "#DCECFF"
// 						}, 2000);
// 					});
// 				} else if (d.status === 400) {
// 					closeEditCartItem();
// 				}
// 			}
// 		});
// 	} else {
// 		showNeedOptions($box);
// 	}
// }
var app = {};

function showAdded(box){
	var s1 = box.find("div.stage1");
	var s2 = box.find("div.stage2");
	s1.hide();
	s2.hide();
	s1.fadeIn("fast", function(){
		setTimeout(function(){
			s1.fadeOut("fast", function(){
				s2.fadeIn("fast");
			});
		}, 500);
	})
}

// function modifyCart(cartItem, cartStruct, newVal){
// //loop through the form input elements to find the selected options, if any
// 	$.post("/actions/actions.cfc?method=modifyCart", { cartItem:cartItem, cartStruct:cartStruct, newVal:newVal },
// 		function(data){
// 			if(cartStruct == 'method'){
// 				refreshCartTotal();
// 			}
// 			$('#cartSaveButton').html('Save Updates');
// 			//$('#cartbox').html(data);
// 		}
// 	);
// }

// function cartQuickAdd(prodid,configuration){
// 		$.ajax({
// 			type: "POST",
// 			data:{id:prodid, configuration:configuration},
// 			url: "/actions/actions.cfc?method=addToCart",
// 			success: function(res){
// 				var result = $.parseJSON(res);
// 				if (result.status === 200) {
// 					updateCartCount(result.count);
// 				}
// 			}
// 		});
// }

// function refreshCartTotal(){
// 	$('.priceDisplayBox').stop(false, true).effect("highlight",{color:"#DCECFF"}, 2000);
// 	sessionKeeper.start();//restart session counter
// 	$.post("/actions/cart.cfc?method=refreshCartTotal",
// 		function(data){
// 			$('.priceDisplayBox').html(data);
// 		}
// 	);
// }

// function refreshItemPrice(tr, cartItem){
// 	$.post("/actions/cart.cfc?method=refreshItemPrice", { cartItem:cartItem },
// 		function(data){
// 			refreshDisplays(data, tr);
// 		}
// 	);
// }

// function updateCartTotal() {
// 	$.post("/actions/cart.cfc?method=getCartTotal", { task: "getCartTotal"},
// 		function(data){
// 			refreshDisplays(data);
// 		}
// 	);
// }

// function refreshDisplays(data, tr){
// 	var result = data;
// 	if(typeof tr === "object"){
// 		var cartItem = tr.attr("class");
// 		tr.find(".itemtotalprice").html(result.item);//item price/total
// 		//item/unit price
// 		if(tr.find(".itemprice").html() != result.itembase){
// 			tr.find(".itemprice").html(result.itembase).stop(false, true).effect("highlight",{color:"#DCECFF"}, 2000);
// 		}
// 	}
// 	// $("#shipTimeHolder").html(result.leadTimeMsg);
// 	$('.cartTotal').html(result.total);//total price
// 	// $("span.cart-count").html(result.numItems);//items count
// }

// function loadingDisplays(tr){
// 	if(tr.length){
// 		tr.find(".itemtotalprice").html("<img src='/layouts/main/styles/images/spinner.gif' />");//item price/total
// 	}
// 	$('.cartTotal').html("<img src='/layouts/main/styles/images/spinner.gif' />");//total price
// 	$("span.cart-count").html("<img src='/layouts/main/styles/images/spinner.gif' />");//items count
// }

// function loadCartNotes(){
// 	$('.cartNote').css({'height':14,'overflow':'hidden'});
// 	$('.cartNote').each(function(){
// 		var iitem = $(this).attr('cid');
// 		$('#shareButton').css('display','none');
// 		//alert(iitem);
// 		$.post("/actions/cart.cfc?method=loadCartNotes", { cartItem:iitem, edit:1 },
// 			function(data){
// 				$('#n'+iitem).html(data).animate({
// 					height:43
// 					},function(){});
// 			}
// 		);
//
// 	});
// 	$('.shareButton').css('display','none');
// 	loadCartOptions('#cartOptionsHolder');
// }

// function loadCartOptions(placeWhere){
//
// 	$.post("/actions/cart.cfc?method=loadCartOptions", { placeWhere:placeWhere },
// 		function(data){
// 			$(placeWhere).html(data);
// 			$('#saveButton').button();
//
// 		}
// 	);
// }

// function saveCart(placeWhere){
// //loop through the form input elements to find the selected options, if any
// 	$.post("/actions/cart.cfc?method=saveCart",
// 		function(data){
// 			$(placeWhere).html(data);
// 			$('#shareButton').css('display','block');
// 			$('#cartSaveButton').html('Cart Saved');
// 			$('.cartNote').each(function(){
// 				var iitem = $(this).attr('cid');
// 				$.post("/actions/cart.cfc?method=loadCartNotes", { cartItem:iitem, edit:0 },
// 					function(data){
// 						$('#n'+iitem).html(data).animate({
// 							height:14
// 							},function(){});
// 					}
// 				);
//
// 			});
//
// 		}
// 	);
// }

// function setShipVia(val) {
// 	$.post("/actions/cart.cfc?method=setShipMethod", { shipvia:val },
// 		function (data) {
// 			refreshCartTotal();
// 		}
// 	);
// }

/*function filterAddresses(searchVal, filterVal, mode){
	$("span.spinner").css("display", "inline-block");
	sessionKeeper.start();//restart session counter
	$.post("/actions/cart.cfc?method=filterShippingAddress", { searchval:searchVal, filterval:filterVal, mode:mode },
		function(data){
			$('#addressOptions').html(data);
			$("span.spinner").hide();
		}
	);
}*/
/*
function changeAddress(id, mode, edit){
	var edit = edit || false;
	$('#addressForm').prepend('<h3 class="loadingText"><img src="/layouts/main/styles/images/spinner.gif" /> Loading </h3><div class="loadingOverlay"></div>');
	$("#aid").val(id);
	sessionKeeper.start();//restart session counter
	$.post("/actions/cart.cfc?method=changeAddress", { aid:id, mode:mode, edit:edit },
		function(data){
			$('#addressForm').html(data);
			$('#addressForm form:first *:input[type!=hidden]:first').focus();
			if(mode == "shipping" && !edit){
				refreshCartTotal();
				if(parseInt(id) === 0){
					$("#ship-address-next").addClass("disable");
				} else {
					$("#ship-address-next").removeClass("disable");
				}
			}
			if($("#validAddress") && $("#validAddress").val() === "false" ){
				$(".btn-continue").addClass("disable");
				if(id !== 0){
					setTimeout(function(){
						$("#newAddy").submit();
					}, 0);
				}
			}
			initAddr();
			var aid = parseInt(id);
			validatePayOptions();
		}
	);
}
*/
// var sessionKeeper = {
// 	timer: "",
// 	sessionLength: 30*(60*1000), //30 minutes - in milliseconds
// 	start: function(){
// 		clearTimeout(sessionKeeper.timer);
// 		sessionKeeper.timer = setTimeout(function(){
// 			sessionKeeper.expire();
// 		}, sessionKeeper.sessionLength);
// 	},
// 	expire: function(){
// 		var box = $("#sExpire");
//
// 		$("#sExpire").dialog({
// 			stackable:true,modal:true,height:'auto',
// 			position:{collision:"none",at:"center center"},width:430,height:290,
// 			open: function(){
// 				$("#sExpire").removeClass("hide");
// 			},
// 			beforeClose:function(){
// 				$("#sExpire").addClass("hide");
// 				$('#sExpire').dialog('destroy').remove();
// 				window.location = window.location.pathname;
// 			},
// 			buttons:[
// 				{ text: box.data("ok"), click: function(){$(this).dialog("close");}},
// 			]
// 		});
// 	}
// }
// var validHelper = {};
// var _z_ = {};
/*
function initCart(){
	//load saved cart
	$("#load-saved").on("change", function(){
		if($(this).val().length){
			location.href="?cartid="+$(this).val();
		}
	});

	//Product Lead Times Dialog
	$("#shopping-cart").on("click", "#pLeadTimes", function(event){
		event.preventDefault();
		var $this = $(this);
		$("#productLeadTimes").dialog({
			modal:true,
			height:480,
			width:480,
			position:{collision:"none",at:"center center"},
			title:$this.data("title"),
			beforeClose:function(){
				$('#productLeadTimes').html("");
			},
			buttons:[
				{ text: $this.data("btnclose"), click: function(){$(this).dialog("close");}},
			]
		});
		$.ajax({
			url:"actions/cart.cfc?method=showLeadTimes",
			success:function(html){
				$("#productLeadTimes").html(html);
			}
		});
	});

	$("#addressfilter").on("change", function(){
		$("#add-filter-text").val("").trigger("keyup").focus();
	});

	$("#add-filter-text").on("keyup", function(event){
		filterAddresses(this.value, $('#addressfilter').val(), $("#add-type").val());
	}).on("keydown", function(event){
		if(event.which === 13){
			event.preventDefault();
		}
	});

	//revise address
	$("div.newAddress").on("click", "#revise-address", function(event){
		event.preventDefault();
		//set to "enter new address"
		$("#newAddress-opt").trigger("click");
		$("input#address1").focus();
	});

	$("#go-to-review").on("click", function(event){
		event.preventDefault();
		var $this = $(this);
		if(!$this.hasClass("disable")){
			$this.addClass("disable");
			//submit billing form to validate
			var type = $("#payType").val();
			if(type === "payCreditCard"){
				$("#billInfo").submit();
			} else {
				validHelper.pay = true;
			}
			//if billing validation passes load review page via ajax
			if(validHelper.pay === true){
				loadReviewPage();
			}
		}
	});

	// $("#ship-address-next").on("click", function(event){
	// 	var $this = $(this);
	// 	if($this.hasClass("disable")) return false; //don't move forward if is disabled
	// 	$this.addClass("disable");
	// 	$('#processing-shipping').dialog({
	// 		stackable:false, modal:true, height:'auto',
	// 		closeOnEscape: false,
	// 		position:{collision:"none"},
	// 		width:460, height:120,
	// 		create:function(){
	// 			$(this).closest(".ui-dialog").find(".ui-dialog-titlebar:first").remove();
	// 		},
	// 		close:function(){
	// 			$('#processing-shipping').dialog('destroy');
	// 		}
	// 	});
	// 	location.href = $this.attr("href");
	// });

	$("#shiptypes input").on("change", function(){
		var type = this.value;
		setShipType(type, function(){
			$("#shiptypesHolder > div").addClass("hide");
			if(type === "standardShipping"){
				$.ajax({
					type:"POST",
					url:"/actions/cart.cfc?method=displayShipServices",
					success: function(res){
						$("#shipServiceList").html(res);
						validateShipOptions(type);
					}
				});
			}
			if(type === "collectShipping"){
				$("#accountNumber").val("");
				$("#shipCompany").val("");
			}
			$("#"+type).removeClass("hide");
			refreshCartTotal();
			validateShipOptions(type);
		});
	});

	$("#collectShipping").on("change", "input", function(){
		var item = this.name;
		var val = this.value;
		$.ajax({
			type:"POST",
			url:"/actions/cart.cfc?method=saveShipAccountInfo",
			data: { item: item, value: val },
			success: function(res){
				var r = res;
			}
		});
	}).on("keyup", function(){
		validateShipOptions("collectShipping");
	});

	function validateShipOptions(type){
		var btn = $("#ship-method-next");

		switch(type){
			case "standardShipping":
				if($("#shipServiceList input:checked").length < 1){
					btn.addClass("disable");
				} else {
					btn.removeClass("disable");
				}

				break;
			case "collectShipping":
				if(!($("#shipCompany").val().length) || !($("#accountNumber").val().length)){
					btn.addClass("disable");
				} else {
					btn.removeClass("disable");
				}
				break;
			default:
				btn.removeClass("disable");
		}

	}

	$("#ship_note").on("change", function(){
		$.ajax({
			type:"POST",
			url:"/actions/cart.cfc?method=setShipNotes",
			data:{notes:this.value}
		});
	});

	$("input.payInfo,textarea.payInfo,select.payInfo").on("change", function(){
		var item = $(this);
		var name = item.attr("name");
		var value = item.val();
		$.ajax({
			type:"POST",
			url:"/actions/cart.cfc?method=setPayInfo",
			data:{key:name, value:value}
		});
	});

	$("#authorizedPurchaser, #acceptTerms").on("change", function(){
		var item = $(this);
		var name = item.attr("name");
		var value = item.is(':checked');
		$.ajax({
			type:"POST",
			url:"/actions/cart.cfc?method=setPayInfo",
			data:{key:name, value:value}
		});
		validatePayOptions('payPO')
	});

	$("#paytypes input[type=radio]").on("change", function(){
		var type = this.value;
		setPayType(type, function(){
			$("#payOptions > div").addClass("hide");
			switch(type){
				case "payCreditCard":

					break;
				case "payPO":

					break;
				case "payDefer":

					break;
			}
			$("#"+type).removeClass("hide");
			validatePayOptions(type);
		});
	});

	$("#payPO").on("keyup", ":input", function(){
		validatePayOptions("payPO");
	});
	// po file upload functionality
	$("#poUploader").on("click", function(){
		$("#poFile").trigger("click");
	});
	$("#poFile").on("change", function(){
		$("#poUploadForm").submit();
		$("#fileSizeError").addClass("hide");
		$("#poUploading").removeClass("hide");
	});
	$("#poUploadFrame").load(function(){
		var res = $.parseJSON($(this).contents().text());
		$("#poUploading").addClass("hide");
		if(res.status === 200){
			$("#poFilePanel div.panel-heading > div").removeClass("hide");
			$("#fileActions").removeClass("hide");
			$("#fileUpload").addClass("hide");
		} else if(res.status === 401){
			//File larger than 5 mb max size
			$("#fileUpload").removeClass("hide");
			$("#fileSizeError").removeClass("hide");
		} else {
			//upload error
			$("#fileContainer").removeClass("hide");
		}
	});
	$("#fileContainer a.change").on("click", function(event){
		event.preventDefault();
		$("#poFile").trigger("click");
	});

	$("#fileContainer a.remove").on("click", function(event){
		event.preventDefault();
		$.ajax({
			type:"POST",
			url:"/actions/cart.cfc?method=removePOFile",
			success: function(res){
				var r = res;
				if(r.status === 200){
					$("#poFilePanel div.panel-heading > div").addClass("hide");
					$("#fileActions").addClass("hide");
					$("#fileUpload").removeClass("hide");
				}
			}
		});

	});

	//validate expiration date
	$("#exp-secure").on("change", "select", function(){
		validExpiration();
	});

	$("#billInfo").on("keyup", ":input", function(){
		validatePayOptions("payCreditCard");
	});

	//validate payment info
	$("#billInfo").validate(function(event){
		sessionKeeper.start();//restart session counter
		//valid
		event.preventDefault();
		$("#go-to-review").removeClass("disable");
		validHelper.pay = true;
		$("#billInfo-errors").hide();
	},
	function(event){
		//fail
		event.preventDefault();
		$("#go-to-review").addClass("disable");
		$("#billInfo-errors").show();
		validHelper.pay = false;
	});

	//Cart Sharing

	$("#share-cart").on("click", function(event){
		event.preventDefault();
		var $this = $(this);
		var dTitle = $this.attr("title");
		var btns = {
			submit: $this.data("btnshare"),
			cancel: $this.data("btncancel"),
			close: $this.data("btnclose")
		}
		$('body').append('<div id="cartSharing" class="popbox"></div>');
		$.post("/actions/cart.cfc?method=openShareCart",
			function(data){
				$('#cartSharing').html(data);
				$('#cartSharing').dialog({
					title: dTitle,stackable:true,modal:true,height:'auto',
					position:{collision:"none",at:"center center"},width:430,height:440, dialogClass: "dialog",
					beforeClose:function(){
						$('#cartSharing').dialog('destroy').remove();
					},
					buttons:[
						{ text: btns.cancel, click: function(){$(this).dialog("close")}},
						{ text: btns.submit, 'class':"btn-primary", click: function(){$("#shrCart").submit()}}
					]
				});
				$("#shrCart").validate(function(event){
					event.preventDefault();
					$.post("/actions/cart.cfc?method=shareCart", $("#shrCart").serialize())
						.done(function(data){
							var d = data;
							if(d.status === 200){
								$('#cartSharing').html(d.msg);
								$('#cartSharing').dialog("option", {
									buttons: [{
										text: btns.close,
										click: function() {
											$(this).dialog("close");
										}}],
								height:200,
								width:360, dialogClass: "dialog",
								position:{collision:"none",at:"center center"}
								});
								$('#cartSharing').siblings('.ui-dialog-buttonpane').find('button:eq(0)').focus();

							} else {
								alert(d.msg);
							}
						});
				});
			}
		);
	});

	// $("a.save-cart").on("click", function(event){
	// 	event.preventDefault();
	// 	var $this = $(this);
	// 	var dTitle = $this.attr("title");
	// 	var btns = {
	// 		save: $this.data("btnsave"),
	// 		cancel: $this.data("btncancel"),
	// 	}
	// 	$('body').append('<div id="saveCart" class="popbox"></div>');
	// 	$.post("/actions/cart.cfc?method=openSaveCart",
	// 		function(data){
	// 			$('#saveCart').html(data);
	// 			$('#saveCart').dialog({
	// 				title: dTitle,stackable:true,modal:true,height:'auto',
	// 				position:{collision:"none",at:"center center"},width:460,height:480, dialogClass: "dialog",
	// 				beforeClose:function(){
	// 					$('#saveCart').dialog('destroy').remove();
	// 				},
	// 				buttons:[
	// 					{ text: btns.cancel, click: function(){$(this).dialog("close");}},
	// 					{ text: btns.save, 'class':"btn-primary", click: function(){$("#frmSaveCart").submit();}}
	// 				]
	// 			});
	// 			$("#frmSaveCart").validate(function(event){
	// 				event.preventDefault();
	// 				$.post("/actions/cart.cfc?method=saveCart", $("#frmSaveCart").serialize())
	// 					.done(function(data){
	// 						var d = data;
	// 						if(d.status === 200){
	// 							$('#saveCart').html(d.msg);
	// 							$('#saveCart').dialog("option", {
	// 								buttons: [],
	// 								height:160,
	// 								width:320
	// 							});
	//
	// 							reload_content();
	// 							setTimeout(function(){$('#saveCart').dialog("close");}, 1800);
	// 						} else {
	// 							alert(d.msg);
	// 						}
	// 					});
	// 			});
	// 		}
	// 	);
	// });
	//request review
	// $("a#request-review").on("click", function(event){
	// 	event.preventDefault();
	// 	$this = $(this);
	// 	var btns = {
	// 		submit: $this.data("btnsubmit"),
	// 		cancel: $this.data("btncancel"),
	// 		close: $this.data("btnclose")
	// 	}
	// 	$.ajax({
	// 		url:"/actions/cart.cfc?method=loadReqReview",
	// 		type:"POST",
	// 		success:function(result){
	// 			$("#review-form").html(result).removeClass("hidden");
	// 			$("#req-review").validate(function(event){
	// 				event.preventDefault();
	// 				var args = {
	// 					goal: $("#review-goal").val(),
	// 					enviro: $("#review-enviro").val(),
	// 					question: $("#review-question").val(),
	// 					solution: $("input[type='radio'][name='solution']:checked").val()
	// 				};
	// 				$.ajax({
	// 					type:"POST",
	// 					url:"/actions/cart.cfc?method=processReview",
	// 					data:args,
	// 					success: function(data){
	// 						var d = data;
	// 						if(d.status == 200){
	// 							$("#review-form").html(d.msg);
	// 							$('#review-form').dialog("option", {
	// 								buttons: [{
	// 									text: btns.close,
	// 									click: function() {
	// 										$(this).dialog("close");
	// 									},
	// 									"class":"right"
	// 								}],
	// 							height:260,
	// 							width:300
	//
	// 							});
	// 						}
	// 					}
	// 				});
	// 			});
	//
	// 			$('#review-form').dialog({
	// 				title:$this.attr('title'),	stackable:false,modal:true,height:'auto',
	// 				position:{collision:"none",at:"center center"},width:725,height:700, closeOnEscape:true, dialogClass: "dialog",
	// 				buttons:[
	// 					{ text: btns.cancel, click: function(){$(this).dialog("close");}},
	// 					{ text: btns.submit, 'class':"btn-primary", click: function(){$("#req-review").submit();}}
	// 				],
	// 				close:function(){
	// 					$(this).dialog("destroy");
	// 				}
	// 			});
	// 		}
	// 	});
	// });

	//submit review request
	$("#req-review").on("submit", function(event){
		event.preventDefault();
		event.stopPropagation();
	});

	//submit order application form
	$("#order-app-form").on("submit", function(event){
		event.preventDefault();
		event.stopPropagation();
	});

	$("#new-cart").on("click", function(){
		var $this= $(this);
		var btns = {
			no: $this.data("btnno"),
			yes: $this.data("btnyes"),
			cancel: $this.data("btncancel"),
		}
		if($("#cart-saved").attr("rel") == "false"){
			$("#confirm-new").dialog({
				resizable:false,
				height:180,
				modal:true, dialogClass: "dialog",
				position:{collision:"none"},
				buttons:[
					{ text: btns.cancel, click: function(){$(this).dialog("close");}},
					{ text: btns.no, click: function(){loadNewCart();$(this).dialog("close");}},
					{ text: btns.yes, 'class':"btn-primary", click: function(){$("a.save-cart").trigger("click");$(this).dialog("close");}}
				],
				open:function(){
					$("#confirm-new").removeClass("hidden");
					$(this).siblings('.ui-dialog-buttonpane').find('button:eq(2)').focus();
				},
				close:function(){
					$("#confirm-new").addClass("hidden");
					$(this).dialog("destroy");
				}
			});
		} else {
			loadNewCart();
		}
	});

	$("#shopping-cart").on("click", "table.cartTable tr a.edit-item", function(event){
		event.preventDefault();
		var $this = $(this);
		var id = $this.data("id");
		var plist = $this.data("plist");
		var cartItem = $this.data("part");
		var title = $this.attr("title");
		var btns = {
			remove:$this.data("btnremove"),
			save:$this.data("btnsave"),
			cancel:$this.data("btncancel")
		}
		$('body').append('<div id="editCartItem" class="popbox"></div>');
		$.post("/actions/cart.cfc?method=editCartItem", { cartItem:cartItem, partlist:plist },
			function(data){
				$('#editCartItem').html(data);
				$('#editCartItem').dialog({
					title:title,stackable:true,modal:true,height:'auto',
					position:{collision:"none",at:"center center"},width:720,height:560, dialogClass: "dialog",
					beforeClose:function(){
						$('#editCartItem').dialog('destroy').remove();
					},
					buttons:[
						{ text: btns.cancel, click: function(){closeEditCartItem();}},
						{ text: btns.save, 'class':"btn-primary", click: function(){updateCartItem(id, cartItem);}}
					]
				});
			}
		);
	});
	//initalize org switcher
	initOrgSwitcher();
	//click address row load address
	$("#addressOptions").on("click", "table tr td:first-child", function(){
		selectAddress($(this).parents("tr"));
	});
	$("#new-address").on("click", function(event){
		event.preventDefault();
		changeAddress(0, $("#add-type").val());
		clearAddress();
	});
	//click address select button load address
	$("#addressOptions").on("click", "table tr td button", function(event){
		event.preventDefault();
		selectAddress($(this).parents("tr"));
	});
	// click edit on address row - load edit address
	$("#addressOptions").on("click", "table tr td a", function(){
		selectAddress($(this).parents("tr"), true);
		$("#newAddy").find(":input").focus();
	});
	// click edit on selected address - load edit address
	$("#addressForm").on("click", "div.select-address a", function(event){
		event.preventDefault();
		var atype = $("#add-type").val();
		var val = $(this).attr("id");
		changeAddress(val, atype, true);
		$("#newAddy").find(":input").focus();
	});
	//click cancel button on add new/ edit address
	$("div.newAddress").on("click", "#cancel-add-new", function(event){
		event.preventDefault();
		var atype = $("#add-type").val();
		var aid = $("#aid").val();
		changeAddress(aid, atype);
	});

	// $("a.c_qtydiscount").on("click", function(event){
	// 	event.preventDefault();
	// 	var $this = $(this);
	// 	var pInfo = $this.attr("id").split("|");
	// 	showQuantityDiscount($this.data("title"), $this.data("btnclose"),  pInfo[0], pInfo[1], pInfo[2], pInfo[3]);
	// });

	function selectAddress(tr, edit){
		var e = edit || false;
		var atype = $("#add-type").val();
		var val = tr.attr("id");
		changeAddress(val, atype, e);
		clearAddress();
		tr.addClass("highlight").find("td:last-child").html($("#sel-text").html());
	};
	function clearAddress(){
		$("#allAddressesBox table").find("tr.highlight").removeClass("highlight").find("td:last-child").html($("#sel-button").html());
	};

	//initialize address functions
	initAddr();

	$("#ccard-select").on("click", "div", function(){
		$(this).find("input").prop("checked", true);
	});

	function loadReviewPage(){
		var pInfo = {
			ctype: $("#ccard-select input:checked").val(),
			cdname: $("#ccard-select input:checked").attr("rel"),
			ccn: $("#ccn").val(),
			name: $("#ccname").val(),
			exp: $("#ccexp-month").val()+$("#ccexp-year").val(),
			conf: $("#ccconf").val()
		};
		var poInfo = {
			poNumber: $("#poNumber").val(),
			poComment: $("#poComment").val()
		}
		var defInfo = {
			deferComment: $("#deferComment").val()
		}

		var cc = pInfo.ctype+"^"+pInfo.ccn+"^"+pInfo.name+"^"+pInfo.exp+"^"+pInfo.conf;
		cc = rot47(cc);
		_z_.Object = {
			Object: {
				c: cc,
			}
		}
		var reviewInfo = {
			ctype:pInfo.cdname,
			lastfour: pInfo.ccn.substr(pInfo.ccn.length-4, 4),
			name: pInfo.name,
			ccexp: pInfo.exp.substr(0,2) + "/" + pInfo.exp.substr(2,2)
		}
		pInfo = {};//clear it...just because

		var rPage = $("#go-to-review").attr("href");
		var url = "components/cart.cfm"+rPage;
		$.ajax({
			type: "POST",
			url: url,
			data:{oktoreview:true},
			dataType:"html",
			success:function(html){
				$("#billInfo").trigger("reset");//clear form
				$("#shopping-cart").html(html);
				window.scrollTo(0,0);
				window.history.pushState(null, null, rPage);//enable back button for review page
				trackPageview("/cart" + rPage);//Track the review page in Google Analytics
				$("#cctype").html(reviewInfo.ctype);
				$("#ccnum").html($("#ccnum").data("lastfour") + " " + reviewInfo.lastfour);
				$("#ccname").html(reviewInfo.name);
				$("#ccexp").html(reviewInfo.ccexp);
				$("#poNumber").html(poInfo.poNumber);
				//handles back button press on ajaxed review page. IMPORTANT!
				window.onpopstate = function(event){
					if(event) window.location.reload();
				};
				document.title = $("#shopping-cart").find("#page-title").val();

				//solution picker
				$("#pick-application").on("click", function(event){
					event.preventDefault();
					sessionKeeper.start();//restart session counter
					$this = $(this);
					var btns = {
						submit: $this.data("btnsubmit"),
						cancel: $this.data("btncancel"),
					}
					$('#app-picker').dialog({
						title:$this.attr("title"),	stackable:false,modal:true,height:'auto',
						position:{collision:"none",at:"center center"},width:725,height:400, dialogClass: "dialog",
						buttons:[
							{ text: btns.cancel, click: function(){$(this).dialog("close");}},
							{ text: btns.submit, 'class':"btn-primary", click: function(){$("#order-app-form").submit();}}
						],
						create:function(){
							$("#order-app-form").validate(function (event) {
								event.preventDefault();
								var args = {
									solution: $("#sol-accordion :input:checked").val()
								};
								sessionKeeper.start();//restart session counter
								$.ajax({
									type:"POST",
									url:"/actions/cart.cfc?method=setOrderSolution",
									data:args,
									success: function(data){
										var d = data;
										$("#order-market").find("em").removeClass("red").html(d.solution);
										$('#app-picker').dialog("close");
									}
								});
							});

						}
					});
				});

				//submit order
				$("#submit-order").on("click", function(event){
					event.preventDefault();
					if(!$(this).hasClass("disable")){
						var orderBtn = $(this);
						orderBtn.addClass("disable");
						$('#processing-order').html($('#processing-order-data').html());
						var dg = $('#processing-order').dialog({
							stackable:false, modal:true,position:{collision:"none"},
							closeOnEscape: false,
							width:460, height:120, dialogClass: "dialog",
							create:function(){
								$(this).closest(".ui-dialog").find(".ui-dialog-titlebar:first").remove();
							},
							close:function(){
								$('#processing-order').dialog('destroy');
							}
						});
						sessionKeeper.start();//restart session counter
						var args = _z_.Object.Object;
						$.ajax({
							type:"POST",
							url:"/actions/cart.cfc?method=submitOrder",
							data:args,
							success:function(data){
								var d = data;
								d.reload || false;
								if (d.status == 200) {
									location.href = $("#submit-order").attr("href");
								} else if(d.status == 400){
									window.location = window.location.pathname;
								} else {//error
									dg.dialog("option", "height", 340);
									$("#processing-order").html("<h3>" + d.msgTitle + "</h3>" + "<p>" + d.msg + "</p>");
									$('#processing-order').dialog("option", "buttons", [{text: orderBtn.data("btnclose"), 'class':"right", click: function(){
										orderBtn.removeClass("disable");
										$(this).dialog( "close" );
										if(d.reload){
											location.reload();
										}
									}}]);
								}
							}
						});
					}
				});


			}
		});
	}

	function rotN(text, map) {
		// Generic ROT-n algorithm for keycodes in MAP.
		var R = new String()
		var i, j, c, len = map.length;
		for(i = 0; i < text.length; i++){
			c = text.charAt(i);
			j = map.indexOf(c);
			if (j >= 0) {
		 	 c = map.charAt((j + len / 2) % len);
			}
			R = R + c;
		}
		return R;
	}

	function rot47(text) {
	  // Hides all ASCII-characters from 33 ("!") to 126 ("~").  Hence can be used
	  // to obfuscate virtually any text, including URLs and emails.
	  var R = new String();
	  R = rotN(text, "!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~")
	  return R;
	}

	$("#invalids").on("click", "button.close", function(event){
		event.preventDefault();
		var $this = $(this).parents("p");
		var id = $this.attr("id");
		$.ajax({
			type:"POST",
			url:"/actions/cart.cfc?method=removeInvalid",
			data:{id:id},
			success:function(data){
				var d = data;
				if(d.status == 200){
					if($("#invalids").find("p.alert").length === 0){
						$("#invalids").remove();
					} else {
						$this.remove();
					}
				}
			}
		});
	});

	function setShipType(t, callback){
		$("#shipType").val(t);
		$.ajax({
			type:"POST",
			url:"/actions/cart.cfc?method=setShipType",
			data:{ type:t },
			success: function(res){
				var r = res;
				if(r.status === 200){
					callback();
				}
			}
		});
	}

	function setPayType(t, callback){
		$("#payType").val(t);
		$.ajax({
			type:"POST",
			url:"/actions/cart.cfc?method=setPayType",
			data:{type:t},
			success: function(res){
				var r = res;
				if(r.status === 200){
					callback();
				}
			}
		});
	}

}

function validatePayOptions(type){
	if(typeof type === "undefined"){
		type = $("#payType").val();
	}
	var btn = $("#go-to-review");
	var addrOK = false;
	if($("#validAddress").val() === "true"){
		addrOK = true;
	};

	switch(type){
		case "payCreditCard":
			var ccname = $("#ccname").val();
			var ccn = $("#ccn").val();
			var ccconf = $("#ccconf").val();
			if(addrOK && ccname.length > 0 && ccn.length > 0 && ccconf.length > 0){
				btn.removeClass("disable");
			} else {
				btn.addClass("disable");
			}
			break;
		case "payPO":
			if(addrOK && $("#poNumber").val().length > 0 && $('#authorizedPurchaser').is(':checked') && $('#acceptTerms').is(':checked')){
				btn.removeClass("disable");
			} else {
				btn.addClass("disable");
			}
			break;
		default:
			btn.removeClass("disable");
	}

}

function loadNewCart(){
	$.ajax({
		type:"POST",
		url:"/actions/cart.cfc?method=newCart",
		success:function(data){
			var d = data;
			if (d.status == 200) {
				updateCartCount();
				reload_content();
			}
		}
	});
}

function validExpiration(){
	var mo = $("#ccexp-month");
	var yr = $("#ccexp-year");
	var d = new Date();
	var m = d.getMonth()+1;
	var year = d.getFullYear().toString().substr(2)*1;
	//make sure month is current or in future

	if((mo.val() >= m) || (mo.val() < m && yr.val() > year)){
		mo.siblings("label.errorMsg").hide();
		mo.removeClass("error");
		yr.removeClass("error");
		$("#billInfo-errors").hide();
		return true;
	} else {
		mo.siblings("label.errorMsg").show();
		mo.addClass("error");
		yr.addClass("error");
		$("#billInfo-errors").show();
		return false;
	}
}

function initAddr(){
	// $("button.save-addr").on("click", function(event){
	// 	event.preventDefault();
	// 	$("#newAddy").submit();
	// });

	//address validation setup
	$("#newAddy").validate(function(event){
		event.preventDefault();
		$("#newAddy-errors").hide();
		//valid save address - do we need to do anything on callback????
		var args = {
			id: $("#aid").val(),
			type: $("#addtype").val(),
			country: $("#country").val(),
			attnname: $("#attnname").val(),
			attnphone: $("#attnphone").val(),
			address1: $("#address1").val(),
			address2: $("#address2").val(),
			address3: $("#address3").val(),
			address4: $("#address4").val(),
			address5: $("#address5").val(),
			city: $("#city").val(),
			state: $(":input[name=state]:enabled").val(),
			postal: $("#postal").val()
		}
		saveAddress(args, function(data){
			if(data.status !== 200){
				$("#newAddy-errors").show();
				//show server error messages for each field
				for(var i in data.errors){
					$("#"+data.errors[i]).addClass("error").siblings("label.errorMsg").show();
				}
				$("body").css("cursor", "default");
			} else {
				changeAddress(data.id, args.type);
			}
		});
	},
	function(event){
		//fail
		event.preventDefault();
		$("body").css("cursor", "default");
		//$("a.btn-continue").removeClass("disable");
		$("#newAddy-errors").show();
	});
	$("#newAddy").on("change", ":input", function(){
		var $this = $(this);
		if($this.attr("id") === "country"){
			var name = $this.val();
			var id = $this.find("option:selected").data("id");
			if(name.length){
				$("#shipNote").addClass("hide");
				$("#addFormBody").removeClass("hide");
			} else {
				$("#addFormBody").addClass("hide");
				$("#shipNote").removeClass("hide");
			}
			$.getJSON("/actions/geo.cfc?method=getStateOptions", {countryid:id})
			.done(function(data){
				if(data.hasOpts){
					var state = $("#statesel");
					state.find("option[value!='0']").remove();
					$.each(data.opts, function(item){
						state.append($("<option />").val(data.opts[item].code).text(data.opts[item].name));
					});
					$("#statesel").val($("#statein").val());
					$("#statesel").removeClass("hide").attr("disabled", false);
					$("#statein").addClass("hide").attr("disabled", "disabled");

				} else {
					$("#statein").removeClass("hide").attr("disabled", false);
					$("#statesel").addClass("hide").attr("disabled", "disabled");
				}
			});
		}
	});
	$("#edit-add").on("click", "button", function(event){
		location.href = $(this).data("href");
	});
	$("#retry-add").on("click", "button", function(event){
		location.reload();
	});
}

function saveAddress(args, callback){
	sessionKeeper.start();//restart session counter
	var args = args;
	$.ajax({
		type:"POST",
		url: "/actions/cart.cfc?method=saveAddress",
		data: args,
		success:function(data){
			var result = data;
			if(typeof callback == "function"){
				callback(result);
			}
			filterAddresses("","", args.type);
		}
	});
}
*/
function loadPopup(dmi, el){
	var title = el.title;
	var btnClose = $(el).data("btnclose");
	$.post("/actions/misc.cfc?method=popupContent", { mid: dmi },
		function(data){
			$('body').append('<div id="helpBox" class="popbox"></div>');
			$('#helpBox').html(data);
			$('#helpBox').dialog({
				title: title, stackable:true,modal:true,
				position:{collision:"none",at:"center center"},width:520,height:410,
				beforeClose:function(){
					$('#helpBox').dialog('destroy').remove();
				},
				buttons:[
					{ text: btnClose, click: function(){$(this).dialog("close");}, "class":"center"}
				]
			});
		}
	);
}

// This function is what fires when the first "Download" button is clicked on the software downloads page.
function generateDl(id, type) {
	$.post("/actions/software.cfc?method=generateDl", {
		task: "generateDl",
		fid: id
	}, function(data) {
		$('body').append('<div id="dlLink"></div>');
		$('#dlLink').html(data);
		$('#dlLink').dialog({
			title: 'Download',
			stackable: true,
			modal: true,
			height: 320,
			position:{collision:"none",at:"center center"},
			width: 440,
			beforeClose: function() {
				$('#dlLink').dialog('destroy').remove();
			},
			buttons: [{
				text: "Cancel",
				click: function() {
					$(this).dialog("close");
				},
				"class": "center"
			}]
		});
		setTimeout(function() {
			$('#softprepare').css('display', 'none');
			$('#softready').css('display', 'block');
		}, 1500);
	});
}

function trackDownloadClick(fid) {
    $.ajax({
        type: "GET",
        url: "/actions/software.cfc?method=trackDownloadClick",
        data: {fid: fid},
        success: function(data) {
            console.log("First AJAX call successful.");
            $.ajax({
                type: "GET",
                url: "/actions/software.cfc?method=trackDownloadClick",
                data: {data: data},
                success: function(response) {
                    console.log("Second AJAX call successful. Response:", response);
                },
                error: function(error) {
                    console.log("Second AJAX call failed. Error:", error);
                }
            });
            $('#dlLink').dialog("close");
        },
        error: function(error) {
            console.log("First AJAX call failed. Error:", error);
        }
    });
}

// This
function initiateDownload(fid) {
	$.ajax({
		type: "POST",
		url: "/actions/software.cfc?method=generateDownload",
		data: { fid },
		success: function(response) {
			response = response.trim();
			console.log('Response:', response); // Log the response data
			window.location.href = "../components/redirect.cfm?fid=" + response;
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log('Error:', textStatus, errorThrown); // Log any errors that occur
		}
	});
}

function aSoftInfo(m3){
	$.post("/actions/software.cfc?method=loadAssignSoftware", {
		m3id: m3
	}, function(data) {
		$('body').append('<div id="dlMang" class="popbox"></div>');
		$('#dlMang').html(data);
		$('#dlMang').dialog({
			title: 'Campbell Software',
			stackable: true,
			modal: true,
			height: 560,
			position:{collision:"none",at:"top center"},
			width: 700,
			beforeClose: function() {
				$('#dlMang').dialog('destroy').remove();
			},
			open: function(){
				$("button.closer").on("click", function(){
					$('#dlMang').dialog("close");
				});
			}
		});
	});
}

function sendAssignment(mi,mo){
	var uname = $('#uname').val();
	var uemail = $('#uemail').val();
	var uorg = $('#uorg').val();
	var sendMailBool = $("#sendEmail").is(":checked") || $("#sendEmail").val() === "always";
	var hasInfo = 1;
	if(uname.length < 1 || uemail.length < 1 || uorg.length< 1 ){
		hasInfo = 0;
	}
	if(hasInfo){
		$.post("/actions/software.cfc?method=sendAssignment", {
			mi: mi,
			uname: uname,
			uemail: uemail,
			uorg: uorg,
			mo:mo,
			sendMail: sendMailBool
		}, function(data) {
			$('#dlMang').html(data);
			setTimeout(function(){filterCCSoft(0);$('#dlMang').dialog("close");},1500);
		});
	}
}

function filterCCSoft(resets){
	sname = $('#namesearch').val();
	hasInfo = 1;
	if(sname.length < 1){
		resets = 1;
	}
	if(resets){
		$('#namesearch').val('');
	}
	if(hasInfo){
		$('#softCCTable').html('<p style="text-align:center;margin-top:60px;"><img src="/layouts/main/styles/images/spinner.gif" /></p>');
		$.post("/actions/software.cfc?method=filterSoftware&rn="+get_timeval(), {
			srchStr: sname,
			resets:resets
		}, function(data) {
			$('#softCCTable').html(data);
			$("#show-all-dl").removeClass("hidden");
		});
	}
}

function get_timeval(){
	d = new Date();
	return d.getTime();
}

function setCompHeight(){
	$("#t1_loc6,#t1_loc7,#t1_loc8").each(function(){
		$(this).height($(".midtd").height());
	});
	$(".hBotFeature").height(500);
}

function zoomImage(imgID){
    $('body').append('<div id="zoomImage" style="text-align:left;"></div>');
	$('#zoomImage').html('<img src="https://campbellsci-res.cloudinary.com/image/upload/c_limit,h_700,w_700/'+imgID+'">').css('overflow-y','auto');
	$('#zoomImage').dialog({title:'Image',stackable:true,beforeClose:function(){$('#zoomImage').remove()},modal:true,position:{collision:"none",at:"top center"},height:'auto',width:'auto'});
}

function loadLabel(labelID){
    $('body').append('<div id="labelDialog" class="popbox"></div>');
	$.ajax({
		type:"POST",
		url:"/actions/misc.cfc?method=loadLabel",
		data:{labelDrop:labelID},
		success:function(data){
			$('#labelDialog').html(data);
			$('#labelDialog').dialog({stackable:true,beforeClose:function(){$('#zoomImage').remove()},modal:true,position:{collision:"none",at:"top center"},height:'auto',width:'auto'});
		}
	});
}



//COMPONENT SCRIPTS#################################################################################################################################################################################################
function setFAQhandlers(){
	$('.faq-quest').bind("click",function(){
		if($('#a'+$(this).attr('rel')).css('display')=='none'){
			$('#q'+$(this).attr('rel')).addClass('faq-quest-sel');
			$('#a'+$(this).attr('rel')).slideDown(200,'swing');
		}
		else{
			$('#q'+$(this).attr('rel')).removeClass('faq-quest-sel');
			$('#a'+$(this).attr('rel')).slideUp(200,'swing');
		}
	});
	$('#faqExpand').bind("click",function(){
		if($('#expander:hidden').length == 0){
			$('.faq-ans').slideDown(200,'swing');
			$('.faq-quest').addClass('faq-quest-sel');
			$('#expander').fadeOut(50,function(){
				$('#collapser').fadeIn(50);
			});

		}
		else{
			$('.faq-ans').slideUp(200,'swing');
			$('.faq-quest').removeClass('faq-quest-sel');
			$('#collapser').fadeOut(50,function(){
				$('#expander').fadeIn(50);
			});
		}
	});
}

function searchFAQs(g,r,l,s){//genre,record,limit,search str
	crsr('wait');
	$.ajax({
		url: "/actions/misc.cfc?method=faqSearch",
		type: "POST",
		data: {genre:g,record:r,limit:l,q:s},
		dataType: "html",
		success: function(html){
			$("#faqDisplay").html(html);
			crsr('default');
			$('.faq-ans').css('display','none');
			$('#faqSearch1').select();
			setFAQhandlers();
		},
		error: function(){
			$("#faqDisplay").html('failed');
			crsr('default');
		}
	});
}

function overflowToggle(interEl) {
	var operatingHeight = 400;
	if($(interEl).prev('.overflow-communicate').attr('data-height')){
		operatingHeight = $(interEl).prev('.overflow-communicate').attr('data-height');
	}
	if($(interEl).prev('.overflow-communicate').height() < operatingHeight*1+1){
		ofheight = $(interEl).prev('.overflow-communicate').attr('ht');
		$(interEl).fadeToggle(900,function(){
			$(interEl).fadeToggle(100)
			$(interEl).children('.overflow-actionbutton').addClass('toggle-up-wide').removeClass('toggle-down-wide');
		});
		$(interEl).prev('.overflow-communicate').animate({ height: ofheight }, 1000);
		$(interEl).prev('.overflow-communicate').addClass("opened");
		//$(interEl).parent('.overflow-watch').css({'max-height':'100%'},1000);
	}else{
		$(interEl).fadeToggle(900,function(){
			$(interEl).fadeToggle(100)
			$(interEl).children('.overflow-actionbutton').addClass('toggle-down-wide').removeClass('toggle-up-wide');
		});
		$(interEl).prev('.overflow-communicate').animate({ height: operatingHeight }, 1000);
		$(interEl).prev('.overflow-communicate').removeClass("opened");
	}
}

function smartResize(timeOut, callback, watch){
	var resized;
	var tO = timeOut || 250;
	var run = false;
	var width = $(window).width(), height = $(window).height();
	$(window).resize(function(){
		switch(watch){
			case "w":
				run = ($(window).width() != width) ? true : false;
				break;
			case "h":
				run = ($(window).height() != height) ? true : false;
				break;
			default:
				run = true;
				break;
		}
		if(run){
			clearTimeout(resized);
			resized = setTimeout(function(){
				callback();
				width = $(window).width(), height = $(window).height();
			}, tO);
		}
	});
}

function loadSlide(slid,area){//,pos pos = the slide position (first or last)
	$.ajax({
		url: "/actions/misc.cfc?method=loadslide",
		type: "POST",
		data: {slid:slid},
		dataType: "html",
		success: function(html){
			$("#"+area).html(html);
			$('.slideNavItem').removeClass('active');
			$('#slideNavItem'+slid).addClass('active');
			currentSlide = slid;
			if($(document).width() < 900){
				scrollToAnchor('slideTop');
			}
			window.location.hash = 'slide='+slid;
			storeSlide(location, slid);
			return false;
		}
	});
	return false;
}

function scrollToAnchor(aid){
    var aTag = $("div[id='"+ aid +"']");
    $('html,body').animate({scrollTop: aTag.offset().top-60},'slow');
}

function storeSlide(loc, slide){
	if(window.localStorage){
		localStorage.setItem(loc.pathname+loc.search, jsTimestamp() + "|" + slide);
	}
}

function jsTimestamp(){
	return Math.floor(Date.now() / 1000);
}

function reLoadSlide(path, area){
	if(window.localStorage){
		var si = localStorage.getItem(path);
		if(si != undefined){
			si = si.split("|");
			if((parseInt(si[0]) + 1210000) > jsTimestamp()){ //1210000
				loadSlide(si[1], area);
			} else {
				localStorage.removeItem(path);
			}
		}
	}
}

function formToJSON(frmObj) {
	var jObj = {};
	var dups = {};
	var fObj = frmObj.serializeArray();
	var count = 0, x, fObj, i;
	fObj.forEach(
		function (item) {
			for (i = 0; i < fObj.length; i++) {
				if (fObj[i].name == item.name) {
					count++;
				}
			}
			if (count > 1) {
				dups[item.name] = true;
			}
			count = 0;
		}
	);

	frmObj.serializeArray().forEach(function (item) {
		if (item.name in dups) {
			jObj[item.name] = jObj[item.name] || [];
			jObj[item.name].push(item.value);
		} else {
			jObj[item.name] = item.value;
		}
	});
	return jObj;
}

function laInterface(){
	$('body').append('<div id="lasInterface" style="text-align:left;"></div>');
	$.ajax({
		url: "/actions/users.cfc?method=loadLAInterface",
		type: "POST",
		dataType: "html",
		success: function(html){
			$('#lasInterface').html(html).css('overflow-y','auto');
			$('#lasInterface').dialog({title:'Login As',stackable:true,beforeClose:function(){$('#lasInterface').remove()},modal:true,position:{collision:"none",at:"top center"},height:400,width:880});
			$("#searchstr").on("keyup", function(event){
				if ($("#searchstr").val().length > 2) {
					var args = {
						searchstr: $("#searchstr").val()
					};
					$.ajax({
						url: "/actions/users.cfc?method=findU",
						type: "POST",
						data: args,
						success: function (data) {
							$("#u-results").html(data);
							$("#u-results").off().on("click", "table tbody tr", function () {
								var id = $(this).attr("id");
								location.href = "/actions/users.cfc?method=startLAs&uid=" + id;
							});
						}
					});
				}
			});

		},
		error: function(){
			$('#lasInterface').dialog({title:'Error',beforeClose:function(){$('#lasInterface').remove()}});
			$('#lasInterface').html("There was an error.");
		}
	});
}

function setCookie(name, value, expiresInDays) {
	expiresInDays = expiresInDays || 365 * 30;
	var d = new Date();
	d.setTime(d.getTime() + (expiresInDays * 24 * 60 * 60 * 1000));
	var expires = "expires=" + d.toUTCString();
	if(name !== ""){
		document.cookie = name + "=" + value +  ";" + expires + ";path=/";
	}
}

function getCookie(name) {
	var value = "; " + document.cookie;
	var parts = value.split("; " + name + "=");
	if (parts.length == 2) return parts.pop().split(";").shift();
  }

function checkFileSize(ele){
	if(ele.files[0].size > 5000000){
		alert('File size limited to 5MB');
		$(ele).val('');
	}
	acceptedTypes = $(ele).attr('accept');
	if(acceptedTypes.search(ele.files[0].type) < 0){
		alert('Only accepted file types are allowed.');
		$(ele).val('');
	}
}

function loadRowVideo(videoBox){
	$('.videoRow').remove();
	$(videoBox).closest('.container').after('<div class="container-fluid videoRow"><div class="container posRel" id="videoContainer"></div></div>');
	var containerWidth = $('#videoContainer').width();
	var computedHeight = containerWidth*0.59;
	var video = $(videoBox).attr('video');
	var moveDown = $(videoBox).attr('down');
	if(moveDown == undefined){
		moveDown = 165;
	}
	$.ajax({
		url: "/actions/misc.cfc?method=loadVideo",
		type: "POST",
		data: {video:video,width:containerWidth,height:computedHeight},
		dataType: "html",
		success: function(res){
			var closeButton = '<span class="videoClose csi-iconfont csi-cancel pointer" onclick="$(\'.videoRow\').remove();" title="close"></span>';
			$('#videoContainer').html(res).append(closeButton);
			setTimeout(function(){
				var offSet = $("#videoContainer").offset().top - moveDown;
				$('html,body').animate({
					scrollTop: offSet
				}, 'slow');
			},100);

		}
	});
	return false;
}

function showCookieSettingsModal() {
	const cookieValue = document.cookie.replace(/(?:(?:^|.*;\s*)cookieConsent\s*\=\s*([^;]*).*$)|^.*$/, '$1');
	const [status, expiryDate] = cookieValue.split('|');
	const isConsentValid = (status === 'granted' || status === 'denied') && new Date(expiryDate) > new Date();

	if (isConsentValid) {
	// User has already given consent or denied it and the 30 day period has not expired
	 return;
	} else {
		modal = $(`
		<div class="modal fade" tabindex="-1" id="cookie-consent-modal" role="dialog" aria-labelledby="cookieSettingsModalLabel" style="display: flex;">
				<div class="modal-dialog d-flex" id="cookie-consent" role="document">
					<div class="modal-content" style="border-radius: 20px; border: 0;">
						<div class="modal-header">
							<div class="h4 modal-title" id="cookieSettingsModalLabel">Cookie Settings</div>
						</div>
						<div class="modal-body">
							<p>This website uses cookies in order to offer you the most relevant information. Please accept cookies for optimal performance.</p>
							<p>Cookies expire 30 days from acceptance.</p>
							<p>Please note that we also leverage third-party tools, such as Google Analytics, which may use cookies to collect information about your browsing activities. We cannot block these cookies, but we ensure that any third-party tools we use are GDPR-compliant and do not collect any personally identifiable information.</p>
							<a href="/privacy#tracking" target="_blank" style="color: black;">View our privacy policy</a>
							<div style="padding-top: 30px;">
								<button type="button" class="btn btn-primary btn-sm gaq " id="accept-cookie-consent" style="margin-right: 5px; width: 150px; filter: drop-shadow(0 0.1rem 0.2rem rgba(0, 0, 0, 0.2));" onclick="updateConsentMode('granted', modal)">Accept Now</button>
								<button type="button" class="btn btn-secondary" style="margin-left: 5px; width: 150px; filter: drop-shadow(0 0.1rem 0.2rem rgba(0, 0, 0, 0.2));" onclick="updateConsentMode('denied', modal)">Reject</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		`);

	// Add the modal to the page with backdrop and keyboard options
	$('body').append(modal);
	modal.modal({
	keyboard: false
	});
}

// Show the modal
modal.modal('show');

// Add the modal styling
  }

function updateConsentMode(consentValue, modal) {
	// Set the cookie expiration date to 30 days from now
	var expirationDate = new Date();
	expirationDate.setDate(expirationDate.getDate() + 30);
	// Set the cookie value to the consent status and expiration date
	var cookieValue = consentValue + '|' + expirationDate.toUTCString();
	document.cookie = 'cookieConsent=' + cookieValue + '; path=/; expires=' + expirationDate.toUTCString();
	// Update the consent mode
	window.dataLayer = window.dataLayer || [];
	function gtag() { dataLayer.push(arguments); }
	gtag('consent', 'update', {
	  'analytics_storage': consentValue
	});
	// Close the modal popup
	modal.modal('hide');
  }

$(document).ready(function() {
	showCookieSettingsModal();
  });
