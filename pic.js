(function() {
	String.prototype.endsWith = function(endstr) {
		if (endstr) {
			return this.lastIndexOf(endstr) == this.length - endstr.length;
		}
	};
	
	window.pic = {};
	var a = window.pic.ajax = {
		_createXhr: function() {
			try {
				//Firefox, Opera 8.0+, Safari
				return new XMLHttpRequest();
			} catch(e) {
				//IE
				try {
					return new ActiveXObject("Msxml2.XMLHTTP");
				} catch(e) {
					try {
						return new ActiveXObject("Microsoft.XMLHTTP");
					} catch(e) {
						throw "Your browser can't support ajax";
					}
				}
			}
		},
		_parseJSON: function(data) {
			if ( typeof data !== "string" || !data ) {
				return null;
			}
			
			data = data.replace(/^\s+(.*)\s+$/, "$1");
			
			if (/^[\],:{}\s]*$/.test(data.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@")
				.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]")
				.replace(/(?:^|:|,)(?:\s*\[)+/g, "")) ) {
				
				return window.JSON && window.JSON.parse ? window.JSON.parse(data) : (new Function("return " + data))();
			} else {
				return false;
			}
		},
		call: function(url, params, fnSuccess) {
			var xhr = a._createXhr();
			xhr.open("GET", url, true);
			xhr.onreadystatechange = fnSuccess;
			xhr.send(null);
		}
	};
	window.onload = function() {
		var configure = {
			maxTop4PicPosition: 500,
			maxLeft4PicPosition: 1000,
			range4Deg: 60,
			maxWidth4ImageBox: 1000,
			maxHeight4ImageBox: 600,
			range4DegPlay: 20,
			seconds4Play: 3,
			number4Play: 10,
			maxWidth4Play: 800,
			maxHeight4Play: 500,
			maxTop4Play: 150,
			maxLeft4Play: 600
		};
		var isWebKit = navigator.userAgent.indexOf("WebKit") >= 0, gallery = document.getElementById("gallery"),
			createThumbPicBox = function(imgItem) { //ignore IE case
				var oDiv = document.createElement("div");
				oDiv.setAttribute("style", (isWebKit? "-webkit-" : "-moz-") + "transform:rotate(" + (Math.random() > 0.5? "" : "-") + Math.random()* configure.range4Deg + "deg);" +
						"background: transparent url(" + imgItem.backUrl + ") no-repeat " + imgItem.backTop + "px " + imgItem.backLeft + "px;" +
						"top:" + Math.random() * configure.maxTop4PicPosition + "px; left:" + Math.random() * configure.maxLeft4PicPosition + "px;");
				oDiv.className = "pic";
				oDiv.iUrl = imgItem.imageUrl;
				return oDiv;
			}, fnSuccess = function() {
				var data, i;
				if (this.readyState == 4) { //request finished
					data = a._parseJSON(this.responseText);
					if (data) {
						for (i = 0 ; i < data.length; i ++) {
							gallery.appendChild(createThumbPicBox(data[i]));
						}
					}
				}
			};
		a.call("./picdata.html", {}, fnSuccess);
		
		var oBody = document.body,
			imageBox = document.getElementById("image2show"),
			dimmer = document.getElementById("imagedimmer"),
			imageAction = document.getElementById("imageaction"),
			autoPlay = document.getElementById("autoplay"),
			maxzIndex = 0,
			imgClicked = null,
			isShowImage = false,
			isAutoPlaying = false,
			autoTimer = null,
			picMouseFocused = false,
			picMousePos = null,
			picMouseMoved = false,
			cancelClick4Pic = false,
			showPicMode = false,
			showDimmer = function() {
				dimmer.style.display = "block";
				dimmer.style.height = document.height + "px";
				dimmer.style.width = document.width + "px";
			},
			showInBox = function(imgUrl) {
				showDimmer();
				imageBox.parentNode.style.display = "block";
				var oImg = new Image();
				oImg.src = imgUrl;
				oImg.onload = function() {
					var wd = oImg.width, ht = oImg.height,
						winWd = window.innerWidth,
						winHt = window.innerHeight;
					
					if (oImg.width > configure.maxWidth4ImageBox) {
						ht = oImg.height * (configure.maxWidth4ImageBox/oImg.width);
						wd = configure.maxWidth4ImageBox;
					}
					if (oImg.height > configure.maxHeight4ImageBox) {
						wd = oImg.width * (configure.maxHeight4ImageBox/oImg.height);
						ht = configure.maxHeight4ImageBox;
					}
					
					var left = (winWd - wd)/2,
						top = (winHt - ht)/2;
					left = left < 0 ? 0 : left;
					top = top < 0? 0 : top;
					oImg.style.height = ht + "px";
					imageBox.style.height = ht + "px";
					oImg.style.width = wd + "px";
					imageBox.style.width = wd + "px";
					imageBox.style.top = top + "px";
					imageBox.style.left = left + "px";
					imageBox.appendChild(oImg);
					isShowImage = true;
				};
			},
			isChildNodeOf = function(srcNode, tarNode) {
				if (srcNode == tarNode) {
					return true;
				} else if (srcNode == oBody || srcNode == oBody.parentNode) {
					return false;
				}
				while (srcNode != tarNode && srcNode != oBody) {
					srcNode = srcNode.parentNode;
					if (srcNode == tarNode) {
						return true;
					}
				}
				return false;
			},
			getFirstPicNode = function() {
				var ndList = gallery.childNodes, i;
				for (i = 0; i < ndList.length; i ++) {
					if (ndList[i].nodeName == "DIV" && (ndList[i].className || "").indexOf("pic") > -1) {
						return ndList[i];
					}
				}
			},
			getLastPicNode = function() {
				var ndList = gallery.childNodes, i;
				for (i = ndList.length - 1; i >= 0 ; i --) {
					if (ndList[i].nodeName == "DIV" && (ndList[i].className || "").indexOf("pic") > -1) {
						return ndList[i];
					}
				}
			},
			isPicNode = function(nd) {
				return nd && nd.nodeName == "DIV" && (nd.className || "").indexOf("pic") > -1;
			},
			escImageShow = function() {
				imageBox.removeChild(imageBox.lastChild);
				dimmer.style.display = "none";
				imageBox.parentNode.style.display = "none";
				isShowImage = false;
			},
			nextImage = function() {
				imgClicked = isPicNode(imgClicked.nextSibling)? imgClicked.nextSibling : getFirstPicNode();
				imageBox.removeChild(imageBox.lastChild);
				showInBox(imgClicked.iUrl);
			},
			preImage = function() {
				imgClicked = isPicNode(imgClicked.previousSibling)? imgClicked.previousSibling : getLastPicNode();
				imageBox.removeChild(imageBox.lastChild);
				showInBox(imgClicked.iUrl);
			},
			autoPlayImage = function() {
				var curPic = getFirstPicNode(),
					zIndex = 1,
					nums = 0,
					showImageAuto = function() {
						var oImg = new Image();
						oImg.src = curPic.iUrl;
						oImg.onload = function() {
							var wd = oImg.width, ht = oImg.height;
							
							if (oImg.width > configure.maxWidth4Play) {
								ht = oImg.height * (configure.maxWidth4Play/oImg.width);
								wd = configure.maxWidth4Play;
							}
							if (oImg.height > configure.maxHeight4Play) {
								wd = oImg.width * (configure.maxHeight4Play/oImg.height);
								ht = configure.maxHeight4Play;
							}
							
							var left = Math.random() * configure.maxLeft4Play,
								top = Math.random() * configure.maxTop4Play;
							oImg.setAttribute("style", (isWebKit? "-webkit-" : "-moz-") + "transform:rotate(" + (Math.random() > 0.5? "" : "-") + Math.random() * configure.range4DegPlay + "deg);");
							oImg.style.height = ht + "px";
							oImg.style.width = wd + "px";
							oImg.style.top = top + "px";
							oImg.style.left = left + "px";
							oImg.style.zIndex = zIndex ++;
							nums ++;
							if (nums >= configure.number4Play) {
								autoPlay.removeChild(autoPlay.firstChild);
								autoPlay.appendChild(oImg);
							} else {
								autoPlay.appendChild(oImg);
							}
							curPic = isPicNode(curPic.nextSibling)? curPic.nextSibling : getFirstPicNode();
						};
					};
				showDimmer();
				autoPlay.style.display = "block";
				showImageAuto();
				isAutoPlaying = true;
				autoTimer = setInterval(showImageAuto, configure.seconds4Play * 1000);
			},
			endAutoPlay = function() {
				dimmer.style.display = "none";
				autoPlay.style.display = "none";
				(autoTimer && clearInterval(autoTimer));
				autoPlay.innerHTML = "";
				isAutoPlaying = false;
			},
			eventHandler = function(e) {
				e = e || event;
				var target = (e.target || e.srcElement);
				
				if (e.type == "mouseover") {
					if (isPicNode(target)) {
						target.style.zIndex = ++ maxzIndex;
					} else if (isChildNodeOf(target, imageBox)) {
						imageAction.style.display = "block";
					}
				} else if (e.type == "mouseout") {
					if (isChildNodeOf(target, imageBox) && !isChildNodeOf((e.toElement || e.relatedTarget), imageBox)) {
						imageAction.style.display = "none";
					}
				} else if (e.type == "click") {
					if (cancelClick4Pic) {
						cancelClick4Pic = false;
						return;
					}
					
					if (target.iUrl) {
						imgClicked = target;
						showInBox(target.iUrl);
						return;
					}
					if (isShowImage && !isChildNodeOf(target, imageBox)) {
						escImageShow();
						return;
					}
					
					if (isAutoPlaying) {
						endAutoPlay();
						return;
					}
					if (target.nodeName == "A" && (target.className || "").indexOf("ico-del") > -1) {
						escImageShow();
					} else if (target.nodeName == "A" && (target.className || "").indexOf("ico-pre") > -1) {
						preImage();
					} else if (target.nodeName == "A" && (target.className || "").indexOf("ico-next") > -1) {
						nextImage();
					} else if (target.nodeName == "A" && (target.className || "").indexOf("ico-auto-play") > -1) {
						autoPlayImage();
					}
				} else if (e.type == "keydown") {
					if (e.keyCode == 27 || e.keyCode == 39 || e.keyCode == 37) {
						if (imageBox.parentNode.style.display == "block") {
							e.preventDefault();
						}
					}
					if (isShowImage) {
						if (e.keyCode == 27 && isShowImage) {
							escImageShow();
						} else if (e.keyCode == 39) {
							isShowImage = false;
							nextImage();
						} else if (e.keyCode == 37) {
							isShowImage = false;
							preImage();
						}
					}
					if (isAutoPlaying) {
						if (e.keyCode == 27) {
							endAutoPlay();
							e.stopPropagation();
							e.preventDefault();
						}
					}
				} else if (e.type == "mousedown") {
					if (isPicNode(target)) {
						picMouseFocused = true;
						picMousePos = {
							x: e.pageX,
							y: e.pageY,
							top: parseInt(target.style.top, 10) || 0,
							left: parseInt(target.style.left, 10) || 0
						};
					}
				} else if (e.type == "mouseup") {
					if (picMouseFocused && picMousePos) {
						picMouseFocused = false;
						picMousePos = null;
						if (picMouseMoved && isPicNode(target)) {
							cancelClick4Pic = true;
							picMouseMoved = false;
						}
					}
				} else if (e.type == "mousemove") {
					setTimeout(function() {
						if (picMouseFocused && picMousePos) {
							picMouseMoved = true;
							target.style.top = (picMousePos.top + e.pageY - picMousePos.y) + "px";
							target.style.left = (picMousePos.left + e.pageX - picMousePos.x) + "px";
						}
					}, 100);
				} else if (e.type == "DOMMouseScroll") {
					if (imageBox.parentNode.style.display == "block") {
						e.preventDefault();
					}
					if (isShowImage) {
						if (e.detail >= 0) {
							isShowImage = false;
							nextImage();
						} else {
							isShowImage = false;
							preImage();
						}
						e.preventDefault();
					}
				}
			};
//		(oBody.attachEvent && oBody.attachEvent("click", eventHandler));
		(oBody.addEventListener && oBody.addEventListener("click", eventHandler, false));
		(oBody.addEventListener && oBody.addEventListener("mouseover", eventHandler, false));
		(oBody.addEventListener && oBody.addEventListener("mouseout", eventHandler, false));
		(gallery.addEventListener && gallery.addEventListener("mousedown", eventHandler, false));
		(gallery.addEventListener && gallery.addEventListener("mousemove", eventHandler, false));
		(gallery.addEventListener && gallery.addEventListener("mouseup", eventHandler, false));
		(oBody.addEventListener && oBody.addEventListener("DOMMouseScroll", eventHandler, false));
		(window.addEventListener && window.addEventListener("keydown", eventHandler, false));
	};
	
})();
