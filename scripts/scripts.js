/* ---------- General ---------- */
var auth2;								// The Sign-In object.
var googleUser;							// The current user.
if(Cookies.get('id') !== undefined)
	var googleUserID = Cookies.get('id');
else
	var googleUserID = -1;			// The current user ID
var images = [];						// The array with found images
var curimg = 0;							// The current selected image
var baseurl = 'https://leuchtmarco.eu'; // The domain root

var InitAuth = function(){
	console.log('InitAuth: '+googleUserID);
	gapi.load('auth2', function(){
		auth2 = gapi.auth2.init({
			client_id: '127945773473-mdlt2dcgjja66ceusq82b4vccni2h6nh.apps.googleusercontent.com',
			cookiepolicy: 'single_host_origin'
		});
		auth2.isSignedIn.listen(signinChanged);
		auth2.currentUser.listen(userChanged);
		if (auth2.isSignedIn.get() == true){
			console.log('InitAuth: signIn() '+googleUserID);
			signIn();
		}else{
			console.log('InitAuth: loadContent() '+googleUserID);
			loadContent();	
		}
	});
}
function loadContent(){
	var list = getParameterByName("list");
	var pub = getParameterByName("pub");
	var priv = getParameterByName("priv");
	var add = getParameterByName("add");
	if (list){
		update_data('gai', list, function(data){
			$("#contentwrap").html(data);
			console.log('loadContent list: loadEdit() '+googleUserID);
			loadEdit();
			if(add){
				window.history.replaceState({}, document.title, "/?list="+list);
				if (has_access(list)){
					$.ajax({
					    url: 'scripts/edititem.txt',
					    success: function(data) {
					        $('#contentwrap').prepend(data);
					        //$('#main0').css('background-image', 'url(../images/ajax-loader.gif)');
					        $('#delete0').css('display', 'none');
							$('#link0').focus().val(document.referrer);
							$('#title0').focus();
					    }
					});
				}
			}
		});
	}else
		if (priv){
			update_data('gal', googleUserID, function(data){
				$("#contentwrap").html(data);
				$(".mainmenu:contains('Own')").addClass('selected');
				console.log('loadContent priv: loadEdit() '+googleUserID);
				loadEdit();
			});
		} else{
			update_data('gal', -1, function(data){
				$("#contentwrap").html(data);
				$(".mainmenu:contains('Public')").addClass('selected');
				console.log('loadContent else: loadEdit() '+googleUserID);
				loadEdit();
			});
		}
}

/* ---------- Session handling ---------- */
function signIn(){
	auth2.signIn().then(function(user){
		googleUser = user.getBasicProfile();
		googleUserID = googleUser.getId();
		Cookies.set('id', googleUserID, {expires: 7, secure: true});
		console.log('signIn: loadEdit() '+googleUserID);
		loadEdit();
	});
}
function signOut(){
	auth2.signOut().then(function(){
		googleUserID = -1;
		Cookies.remove('id');
		window.open(window.location.href, '_self');
	}, function(error){
		console.log('signOut: '+error)
	});
}
function signinChanged(val){
	console.log('Signin state changed to ', val);
};
function userChanged(user){
	//do something
};
function has_access(){
	if (googleUserID == $('.listname').attr('id'))
		return true;
	else
		return false;
}
function loadEdit(){
	if (googleUserID !== -1){
		$('#sign-in').hide();
		$('#sign-out').show();
		$('.ownlists').show();
		var list = getParameterByName("list");
		var priv = getParameterByName("priv");
		if(list){
			if(has_access(list)){
				$('.btnNewItem').show();
				$('.iEdit').show();
				$('#quickadd').parent().attr('href', "javascript:window.open('https://leuchtmarco.eu/?list="+list+"&add', '_self');");
				$('#quickadd').html('Add to '+$('.listname').html());
				$('#quickadd').show();
			}
		}else if(priv){
			$('.btnNewList').show();
			$('.lEdit').show();
		}
	}
}

/* ---------- Image handling ---------- */
function get_img(url){
	$('#prev0').prop("disabled", true);
	$('#image0').prop("disabled", true);
	$('#next0').prop("disabled", true);
	$('.iLoader').show();
	update_data('parser', url, function(data){
		if(data != 'false'){
			images = JSON.parse(data);
			curimg = 0;
			console.log('images.length: '+images.length);
			console.log(images);
			if ($('#image0').val() == '')
				change_bg(images[curimg]);
			else
				images.unshift($('#image0').val());
			if (images.length >= 1)
				$('#main0').children(".iButton").css("display", "block");
		}
		$('.iLoader').hide();
		$('#prev0').prop("disabled", false);
		$('#image0').prop("disabled", false);
		$('#next0').prop("disabled", false);
	});
}
function change_bg(url){
	$('#main0').css('background-image', 'url('+url+')');
	$('#image0').val(url);
	//console.log('Image: '+url);
	$('#prev0').prop("disabled", false);
	$('#image0').prop("disabled", false);
	$('#next0').prop("disabled", false);
}
function prevImage(start){
	$('#prev0').prop("disabled", true);
	$('#image0').prop("disabled", true);
	$('#next0').prop("disabled", true);
	if(start === undefined)
		var start = curimg;
	if(curimg>0)
		curimg = curimg - 1;
	else
		curimg = images.length-1;
	if(curimg == 0)
		change_bg(images[curimg]);
	else{
		getMeta(images[curimg], function(data){
			if(data){
				change_bg(images[curimg]);
			}else{
				images.splice(curimg, 1);
				if(curimg != start)
					prevImage(start);
			}
		});
	}
}
function nextImage(start){
	$('#prev0').prop("disabled", true);
	$('#image0').prop("disabled", true);
	$('#next0').prop("disabled", true);
	if(start === undefined)
		var start = curimg;
	if(curimg < images.length-1)
		curimg = curimg + 1;
	else
		curimg = 0;
	if(curimg == 0)
		change_bg(images[curimg]);
	else{
		getMeta(images[curimg], function(data){
			if(data){
				change_bg(images[curimg]);
			}else{
				images.splice(curimg, 1);
				if(curimg != start)
					nextImage(start);
			}
		});
	}
}
function getMeta(url, callback){
	var img = new Image();
	img.onload = function(){
		console.log('curimg: '+curimg+' | width: '+this.naturalWidth+' | height: '+this.naturalHeight);
        if((this.naturalWidth < 167) || (this.naturalHeight < 167)){
        	if (typeof callback === "function") callback(false);
        }
        else{
        	if (typeof callback === "function") callback(true);
        }
	};
	img.onerror = function(){
		//console.log('Image not available!');
		if (typeof callback === "function") callback(false);
	};
	img.src = url;
}
function get_ogm(url){
	update_data('ogm', url, function(data){
		return JSON.parse(data);
	});
}

/* ---------- List ---------- */
function NewList(){
	CancelList(function(data){
		if ($('#list0').length == 0){
			$.ajax({
			    url: 'scripts/editlist.txt',
			    success: function(data){
			        $('#contentwrap').prepend(data);
			        $('#hash0').val(ID());
			        $('#delete0').css('display', 'none');
			        if ($('.mainmenu.selected').html() == 'Public lists')
						$('#public0').prop('checked', true);
			        $('#userid0').val(googleUserID);
			    }
			});
		}
	});
}
function EditList(id){
	CancelList(function(data){
		if ($('#list0').length == 0){
			$.ajax({
				url: 'scripts/editlist.txt',
				success: function(data1){
					var image = $('#list'+id+' .lMain').css('background-image');
					$('#list' + id).replaceWith(data1);
					update_data('gl', id, function(data2){
						var list = JSON.parse(data2);
						$('#title0').val(list['name']);
						$('#desc0').val(list['description']);
						$('#id0').val(list['id']);
						$('#userid0').val(list['user_id']);
						$('#hash0').val(list['public_id']);
						$('#public0').prop('checked', list['public'] == 1 ? true : false);
						$('#main0').css('background-image', image);
					});
				}
			});
		}
	});
}
function SaveList(){
	if (($('#desc0').val() != "") && ($('#title0').val() != "")){
		var edit = $('#frmList').serialize();
		update_data('sl', edit, function(id){
			$.ajax({
			    url: 'scripts/list.txt',
			    success: function(data1){
			    	var image = $('#main0').css('background-image');
			    	$('#list0').replaceWith(data1);
			    	update_data('gl', id, function(data2){
						var list = JSON.parse(data2);
						$('#list0 .lEdit').attr('onclick', "EditList('"+id+"')");
						$('#list0 .lEdit').show();
						$('#list0 .lLink').attr('href', '/?list='+list['public_id']);
						$("#list0 .lMain").css('background-image', image);
						$('#list0 .lTitle').html(list['name']);
						$('#list0 .lDesc').html(list['description']);
						$('#list0').attr('id', 'list'+id);
					});
			    }
			});
		});
	}else alert("Please complete the form.");
}
function DeleteList(){
	if ($('#id0').val() == "-1")
		$('#list0').remove();
	else if (confirm('Delete the List and related items: "'+$('#title0').val()+'"?'))
		update_data('dl', $('#id0').val(), function(data){
			$('#list0').remove();
		});
}
function CancelList(callback){
	if ($('#list0').length != 0){
		if ($('#id0').val() == -1){
			$('#list0').remove();
			if (typeof callback === "function") callback(true);
		}else{
			var id = $('#id0').val();
			$.ajax({
			    url: 'scripts/list.txt',
			    success: function(data1){
			    	var image = $('#main0').css('background-image');
			    	$('#list0').replaceWith(data1);
			    	update_data('gl', id, function(data2){
						var list = JSON.parse(data2);
						$('#list0 .lEdit').attr('onclick', "EditList('"+id+"')");
						$('#list0 .lEdit').show();
						$('#list0 .lLink').attr('href', '/?list='+list['public_id']);
						$("#list0 .lMain").css('background-image', image);
						$('#list0 .lTitle').html(list['name']);
						$('#list0 .lDesc').html(list['description']);
						$('#list0').attr('id', 'list'+id);
						if (typeof callback === "function") callback(true);
					});
			    }
			});
		}
	} else
		 if (typeof callback === "function") callback(true);
}

/* ---------- Item ---------- */
function NewItem(){
	CancelItem(function(data) {
		if ($('#item0').length == 0){
			$.ajax({
			    url: 'scripts/edititem.txt',
			    success: function(data){
			        $('#contentwrap').prepend(data);
			        $('#delete0').css('display', 'none');
			    }
			});
		}
	});
}
function EditItem(id){
	CancelItem(function(data){
		if ($('#item0').length == 0){
			$.ajax({
			    url: 'scripts/edititem.txt',
			    success: function(data1){
			    	$('#item' + id).replaceWith(data1);
			    	update_data('gi', id, function(data2){
						var item = JSON.parse(data2);
						get_img(item['link']);
						$('#title0').val(item['name']);
						$('#link0').val(item['link']);
						$('#id0').val(item['id']);
						$('#image0').val(item['image']);
						$("#main0").css('background-image', 'url('+item["image"]+')');
					});
			    }
			});
		}
	});
}
function SaveItem(){
	if (($('#link0').val() != "") && ($('#title0').val() != "")){
		var list = getParameterByName("list");
		if (list)
			$('#list0').val(list);
		var edit = $('#frmItem').serialize();
		update_data('si', edit, function(id){
			$.ajax({
			    url: 'scripts/item.txt',
			    success: function(data1){
			    	$('#item0').replaceWith(data1);
			    	update_data('gi', id, function(data2){
						var item = JSON.parse(data2);
						$('#item0 .iEdit').attr('onclick', "EditItem('"+id+"')"); 
						$('#item0 .iEdit').show();
						$('#item0 .iLink').attr('href', '//'+item['link']);
						$("#item0 .iMain").css('background-image', 'url('+item["image"]+')');
						$('#item0 .iTitle').html(item['name']);
						$('#item0').attr('id', 'item'+id);
					});
			    }
			});
		});
	}else alert("Please complete the form.");
}
function DeleteItem(){
	if ($('#id0').val() == "-1")
		$('#item0').remove();
	else if (confirm('Delete the entry: "'+$('#title0').val()+'"?'))
		update_data('di', $('#id0').val(), function(data){
			$('#item0').remove();
		});
}
function CancelItem(callback){
	if ($('#item0').length != 0){
		if ($('#id0').val() == -1){
			$('#item0').remove();
			if (typeof callback === "function") callback(true);
		} else {
			id = $('#id0').val();
			$.ajax({
			    url: 'scripts/item.txt',
			    success: function(data1){
			    	$('#item0').replaceWith(data1);
			    	update_data('gi', id, function(data2){
						var item = JSON.parse(data2);
						$('#item0 .iEdit').attr('onclick', "EditItem('"+id+"')");
						$('#item0 .iEdit').show();
						$('#item0 .iDelete').attr('onclick', "DeleteItem('"+id+"')");
						$('#item0 .iLink').attr('href', '//'+item['link']);
						$("#item0 .iMain").css('background-image', 'url('+item["image"]+')');
						$('#item0 .iTitle').html(item['name']);
						$('#item0').attr('id', 'item'+id);
						if (typeof callback === "function") callback(true);
					});
			    }
			});
		}
	} else
		 if (typeof callback === "function") callback(true);
}

/* ---------- Selected elements ---------- */
function SelItem(element, state){
	if (state){
		$(element).find(".iEdit").css("border-color", "rgba(0,151,219,0.9) transparent transparent transparent");
		$(element).find(".iTitle").css("background", "#0097DB");
	}
	else{
		$(element).find(".iEdit").css("border-color", "rgba(0,0,0,0.9) transparent transparent transparent");
		$(element).find(".iTitle").css("background", "#151515");
	}
}
function SelList(element, state){
	if (state){
		$(element).find(".lEdit").css("border-color", "transparent transparent rgba(0,151,219,0.9) transparent");
		$(element).find(".lTitle").css("background", "#0097DB");
	}
	else{
		$(element).find(".lEdit").css("border-color", "transparent transparent rgba(0,0,0,0.9) transparent");
		$(element).find(".lTitle").css("background", "#151515");
	}
}

/* ---------- async data transfer ---------- */
function update_data(p1, p2, callback){
	$.ajax({
		url: "scripts/update.php",
		method: "POST",
		data: {act: p1, par: p2},
		dataType: "html"
	})
		.done(function(data){
			if (data != false)
				callback(data);
			else
				alert('No data found');
		})
		.fail(function(jqXHR, textStatus){
			alert("Request failed: " + textStatus);
		});
}

/* ---------- Helper functions ---------- */
function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}
function ID() {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  return Math.random().toString(36).substr(2, 10);
}

function getParameterByName(name, url){
	if (!url)
		url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
	    results = regex.exec(url);
	if (!results)
		return null;
	if (!results[2])
		return true;
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}