(function($){
	
	$.widget('ui.sortable',$.extend($.ui.sortable.prototype,{
		_isOverAxis: function( x, reference, size ) {
			var sensitivityTolerance = this.options.sensitivityTolerance;
			return ( x >= reference + sensitivityTolerance ) && ( x < ( reference + size - sensitivityTolerance ) );
		},
	}));
	
	var Gridstrap = function(el, opts) {
		this.container = $(el);
		var self = this;
		var container = this.container;
		
		this.opts = $.extend(true,{
			width: 12,
			defaultWidth: 3,
			connectWith: '.gridstrap:visible .gs-row',
			scroll: true,
			scrollParent: false,
			scrollCallback: false,
			resizable:{
				handles: 'e',
				start: function(e,ui){
					ui.element.css('transition-duration','0s');
				},
				resize:function(e,ui){
					self._resizeCallback(this,ui,e);
				},
				stop: function(e,ui){
					$(this).css('width','');
					$(this).trigger('gs:resized');
					ui.element.css('transition-duration','');
				}
			},
			gsColTransitionWidth: 400, //$gs-col-transition-width .gs-col{ transition width duration }, .gs-margin{ transition width left }
			debugEvents: false,
			//debugEvents: true,
			debugColor: 0,
			cloneCallback: null,
			sensitivityTolerance: 15,
			//cursorAtSmooth: 400,
			cursorAtSmooth: 0,
		}, opts || {} );
		this.itemsSelector = '> .gs-real:not(.gs-moving)';
		
		//this.currentActiveSortables = [];
		
		container.addClass('gridstrap');
		
		container.on('mouseover.gs', '.gs-col', function(e){
			if(e.stopNamespacePropagation) return;
			e.stopNamespacePropagation = true;
			this.classList.add('gs-mouseover');
		}).on('mouseout.gs', '.gs-col', function(e){
			if(e.stopNamespacePropagation) return;
			e.stopNamespacePropagation = true;
			this.classList.remove('gs-mouseover');
		});
		
		
		this.rootRow = container.find('>.gs-row');
		if(!this.rootRow.length){
			this.rootRow = $('<div class="gs-row" />').appendTo(container);
		}
		
		this.sortable(this.rootRow);
	};
	Gridstrap.prototype = {		
		_resizeCallback: function(el,ui,e){
			var $this = $(el),
				containerW = $this.parent().innerWidth();
			$this
				.attr('data-gs-col', Math.round( ui.size.width / ( containerW/this.opts.width ) ) )
				.trigger('gs:resizing');
		},
		
		_rowWidth: function(row, n){
			return row.width() * n/this.opts.width;
		},
		
		_disableTargets: function(row,ui){
			var self = this;
			var el = ui.item;
			var accepted = el.attr('data-gs-accepted-container');
			var rowCol = row.closest('.gs-col');
			$('.gs-row.ui-sortable',self.container).each(function(){
				var $this = $(this);
				var ok;
				ok = !$this.closest('.gs-moving').length;
				if(ok){
					ok = !accepted || $this.closest('.gs-col').is(accepted);
				}
				if(ok){
					el.find('[data-gs-accepted-container]').each(function(){
						var accepted = $(this).attr('data-gs-accepted-container');
						if(!el.is(accepted)&&!rowCol.is(accepted)){
							ok = false;
							return false;
						}
						
					});
				}
				if(!ok){
					$this.sortable('disable');
					row.sortable('refresh');
				}
			});
		},
		_reenableTargets: function(row,ui){
			var self = this;
			$('.gs-row.ui-sortable',self.container).each(function(){
				var $this = $(this);
				if($this.sortable('instance')){
					$this.sortable('enable');
					row.sortable('refresh');
				}
			});
		},
		_aloneInTheRow: function(el){
			return el.siblings('.gs-real:not(.gs-placeholder, .gs-moving)').length<1;
		},
		_aloneInTheLine: function(el, row){
			var self = this;
			var line = 0;
			var element = el.get(0);
			var found = false;
			var result = false;
			if(!row){
				row = el.parent();
			}
			$(row).children().not('.gs-moving').each(function(){
				var col = $(this);
				
				if(!col.hasClass('gs-real')&&this!==element){
					return;
				}
				
				var w = self.outerWidth(col);
				var lw = line + w;
				if(found){
					result = line==0 || lw > 12;
					return false;
				}
				if(lw > 12){
					line = w;
				}
				else{
					if(lw==12){
						line = 0;
					}
					else{
						line = lw;
					}
				}
				if(this===element){
					result = true;
					found = true;
				}
			});
			return result;
		},
		_getWidthFor:function(item){
			return Math.floor(this._rowWidth(item.parent(),this.width(item)));
		},
		_autoAdjust: function(el,helper,row){
			if(!this._aloneInTheRow(el)&&this._aloneInTheLine(el,row)){
				el.height(helper.height());
			}
			else{
				el.css('height','');
			}
			el.show();
		},
		
		_isOverAxis: function( x, reference, size ) {
			return ( x >= reference ) && ( x < ( reference + size ) );
		},
		
		_getCurrentOrderedCols: function(row,ui){
			var sCols = [];
			var cols = row.find('> .gs-placeholder, > .gs-real:not(.gs-moving)');
			cols.each(function(){
				if(this===ui.placeholder[0]){
					sCols.push( ui.item );
				}
				else{
					sCols.push( $(this) );
				}
			});
			return $(sCols);
		},
		
		_attribDataRow: function(row,ui){
			var self = this;
			var cols = self._getCurrentOrderedCols(row,ui);
			var currentRow = 1;
			var ttWidth = 0;
			cols.each(function(){
				var $this = $(this);
				ttWidth += self.width( $this );
				if(ttWidth>self.opts.width){
					ttWidth = 0;
					currentRow++;
				}
				$this.attr('data-gs-row',currentRow);
			});
		},		
		
		activeRow : null,
		gsFrom : null,
		gsRowOrigin : null,
		_isInRowOrigin : function(el){
			return this.gsRowOrigin===el.closest('.gs-row')[0];
		},
		updateLineOffset : function(item){
			var offset = item.offset();
			var lineOffset = this.lineOffset;
			lineOffset.top = offset.top;
			lineOffset.bottom = lineOffset.top+item.outerHeight();
			lineOffset.left = offset.left;
			lineOffset.right = lineOffset.left+item.outerWidth();
			
		},
		lineOffset : {},
		sortable: function(rows){
			var self = this;
			rows.each(function(){
				var row = $(this);
				var autoHeightTimeout;
				var sortable;
				if(row.hasClass('ui-sortable')){
					row.sortable('refresh');
					return;
				}
				var sortableOptions = {
					
					items: self.itemsSelector,
					connectWith: self.opts.connectWith,
					
					revert: 'invalid',
					
					scroll: self.opts.scroll,
					scrollSensitivity: 20, //default 20
					scrollSpeed: 20, //default 20
					
					tolerance: 'pointer', //intersect || pointer
					sensitivityTolerance: self.opts.sensitivityTolerance,
					
					placeholder: 'gs-placeholder',
					
					cursor: 'grabbing',
					
					helper:function(e,item){
						
						var helper = item.clone()
							.addClass('gs-helper')
							.removeClass('gs-real')
							.css({
								height: (item.outerHeight())+'px',
								width: (item.outerWidth())+'px',
							})
						;
						//cursorAtSmooth
						if(self.opts.cursorAtSmooth){
							helper.css({
								position:'fixed',
								top:item.offset().top,
								left:item.offset().left,
								'transition-property':'top, left',
								'transition-duration':self.opts.cursorAtSmooth+'ms',
							});
						}
						return helper;
					},
					appendTo: self.container, //fix z-index issues
					
					start: function(e, ui){
						if(self.opts.debugEvents) console.log('start',this);
						
						var item = ui.item;
						var ph = ui.placeholder;
						
						//cursorAtSmooth
						if(self.opts.cursorAtSmooth){
							setTimeout(function(){
								ui.helper.css('transition-duration','0s');
							},self.opts.cursorAtSmooth);
						}
						
						//view
						item.addClass('gs-moving').show();
						ph
							.html('<div class="gs-content"/>')
							.attr('data-gs-col',self.outerWidth(item))
						;
						
						
						self._autoAdjust(ui.placeholder,ui.helper);
						
						self.updateLineOffset(item);
						
						item.hide();
						
						
						//store
						item.data('gs-startrow',row.get(0));
						item.data('gs-startindex',item.index());
						
						//allowed drop area
						self._disableTargets(row, ui);
						
						//from 3rd draggable
						if(!item.hasClass('gs-integrated')){
							ui.helper.addClass('gs-sortable-helper');
						}
						
					},
					activate: function(e, ui){						
						if(self.opts.debugEvents) console.log('activate',this);
						
						//prevent strobe
						self.gsRowOrigin = null;
						
						//highlight area
						this.classList.add('gs-state-highlight');						
					},
					over: function(e, ui){
						if(self.opts.debugEvents) console.log('over',this);
						
						var integrated = ui.helper.hasClass('gs-integrated');
						if(!integrated){
							ui.helper.appendTo(document.body).css({
								width:'',
								height:'',
							}).show();
						}
						
						self.activeRow = row;
						
						var ph = ui.placeholder;
						
						//view						
						self._autoAdjust(ph,ui.helper);
						
						//prevent strobe
						if(!self.gsRowOrigin){
							if(integrated){
								self.gsRowOrigin = row[0];
							}
							else{
								self.gsRowOrigin = ph.closest('.gs-row')[0];
							}
							self.gsFrom = ph.clone().attr('class','gs-from');
							self.gsFrom.hide();
							self.gsFrom.insertAfter(ph);
						}
						if(self._isInRowOrigin(ph)){
							self.gsFrom.hide();
						}
						else{
							self._autoAdjust(self.gsFrom,ui.helper,self.gsRowOrigin);
						}
						
							
						self.updateLineOffset(ph);
						
						//highlight area
						self.container.find('.gs-state-over').removeClass('gs-state-over');
						row.addClass('gs-state-over');
						
						//from 3rd draggable
						if(!ui.item.hasClass('gs-integrated')){
							var lastItem;
							row.find(self.itemsSelector).each(function(){
								var item = $(this);
								var offset = item.offset();
								var isOverElementHeight = self._isOverAxis( sortable.positionAbs.top + sortable.offset.click.top, offset.top, item.height() );						
								if(isOverElementHeight){
									lastItem = item;
								}
							});
							ph.insertAfter(lastItem);
						}
						
					},
					change: function(e, ui, manual){
						if(self.opts.debugEvents){
							console.log(manual!==true?'change':'change manual from sort',this);
						}
						
						//prevent strobe
						if(self._isInRowOrigin(ui.placeholder)){
							self.gsFrom.hide().insertAfter(ui.placeholder);
						}
						
						var ph = ui.placeholder;
						
						self._autoAdjust(ui.placeholder,ui.helper);
						
						self.updateLineOffset(ph);
						
					},
					deactivate: function(e, ui){
						if(self.opts.debugEvents) console.log('deactivate',this);
						
						sortable.cancelHelperRemoval = false; //hack to solve this issue https://bugs.jqueryui.com/ticket/13024
						
						this.classList.remove('gs-state-highlight');
						
						row.find('.gs-from').remove();
						
					},
					out: function(e, ui){
						if(self.opts.debugEvents) console.log('out',this);
						
						//highlight area
						row.removeClass('gs-state-over');
						
						//prevent strobe
						if(ui.helper&&self._isInRowOrigin(ui.placeholder)){
							self._autoAdjust(self.gsFrom,ui.helper);
						}
						
					},
					stop: function(e, ui){
						if(self.opts.debugEvents) console.log('stop',this);
						var item = ui.item;
						
						//view
						self.gsFrom.remove();
						item.removeClass('gs-moving');
						
						//store
						if(item.data('gs-startrow')!==item.closest('.gs-row').get(0)){
							if(self.opts.debugEvents) console.log('gs:col:changed',this);
							row.trigger('gs:col:changed',[ui]);
						}
						if(item.data('gs-startindex')!==item.index()){
							if(self.opts.debugEvents) console.log('gs:row:changed',this);
							row.trigger('gs:row:changed',[ui]);
						}
						
						//from 3r draggable
						if(!item.hasClass('gs-integrated')){
							item.css('height','');
							item.css('min-height','');
							item.css('left','');
							item.css('top','');
							item.css('width','');
							row.trigger('gs:received',[ui]);
							item.addClass('gs-integrated');
							item.removeClass('gs-sortable-helper');
						}
						
						//allowed drop area
						self._reenableTargets(row, ui);
					},
					
					/*
					beforeStop: function(e, ui){
						if(self.opts.debugEvents) console.log('beforeStop',this);
					},
					update: function(e, ui){
						if(self.opts.debugEvents) console.log('update',this);
					},
					create: function(e, ui){
						if(self.opts.debugEvents) console.log('create',this);
					},
					receive: function(e, ui){
						if(self.opts.debugEvents) console.log('receive',this);
					},
					remove: function(e, ui){
						if(self.opts.debugEvents) console.log('remove',this);
					},
					*/
					sort: function(e, ui){
						
						//cursorAtSmooth
						if(self.opts.cursorAtSmooth){
							ui.helper.css({
								position: 'fixed',
								top: e.pageY+'px',
								left: e.pageX+'px',
							});
						}
						
						var cursorY =  e.pageY;
						var cursorX =  e.pageX;
						
						var sensitivityTolerance = self.opts.sensitivityTolerance;
						
						var item = ui.item;
						var ph = ui.placeholder;
						var lineOffset = self.lineOffset;
						var lineTop = lineOffset.top-sensitivityTolerance;
						var lineBottom = lineOffset.bottom+sensitivityTolerance;
						var lineLeft = lineOffset.left-sensitivityTolerance;
						var lineRight = lineOffset.right+sensitivityTolerance;
						var beforeItem;
						
						var selector = '.gs-real:not(.gs-moving)';
						if(cursorY>lineBottom){
							self.activeRow.children(selector).each(function(){
								var $this = $(this);
								var offset = $this.offset();
								if((offset.top+$this.height()>cursorY && offset.left>cursorX) || offset.top>cursorY){
									return false;
								}
								beforeItem = this;
							});
							if(self.opts.debugEvents) console.log('movedown',cursorY,'>',lineBottom,beforeItem);
							if(beforeItem){
								ph.insertAfter(beforeItem);
							}
						}
						else if(cursorY<lineTop){
							self.activeRow.children(selector).reverse().each(function(){
								var $this = $(this);
								var offset = $this.offset();
								if((offset.left<cursorX && offset.top<cursorY) || offset.top+$this.height()<cursorY){
									return false;
								}
								beforeItem = this;
							});
							if(self.opts.debugEvents) console.log('moveup',cursorY,'<',lineTop,beforeItem);
							if(beforeItem){
								ph.insertBefore(beforeItem);
							}
						}
						
						if(beforeItem){
							ph.show();
							row.trigger('sortchange');
							sortableOptions.change(e, ui, true);
						}
					
							
						if(scrollCallback){
							scrollCallback(e, ui);
						}
					},
				};
				if(!self.opts.cursorAtSmooth){
					sortableOptions.cursorAt = { left: 5, top: 5 };
				}
				
				var scrollCallback;
				if(self.opts.scrollCallback){
					var scrollParent = self.opts.scrollParent || row.scrollParent();
					if(typeof(scrollParent)=='function'){
						scrollParent = scrollParent(row);
					}
					var scrollParentEl = scrollParent[0];
					scrollCallback = function(event, ui){
						var overflowOffset = scrollParent.offset();
						if( overflowOffset.top + scrollParentEl.offsetHeight - event.pageY < sortableOptions.scrollSensitivity ){
							self.opts.scrollCallback(scrollParentEl.scrollTop + sortableOptions.scrollSpeed, scrollParent);
						}
						else if( event.pageY - overflowOffset.top < sortableOptions.scrollSensitivity ){
							self.opts.scrollCallback(scrollParentEl.scrollTop - sortableOptions.scrollSpeed, scrollParent);
						}
					};
				}
				
				row.sortable(sortableOptions);
				sortable = row.data('ui-sortable');
				sortable.__gridstrap = self;
			});
		},
		
		prepareAdd: function(el,width,container){
			var self = this;
			if(!width){
				width = el.attr('data-gs-col') || this.defaultWidth;
			}
			el.attr('data-gs-col',width);
			el.addClass('gs-col');
			el.addClass('gs-integrated');
			if(!container){
				container = this.container;
			}
			if(el.parent().get(0)!==container.get(0)){
				container.append(el);
			}
			this.sortable(container);
			self.container.trigger('gs:adding');
		},
		handleAdd: function(el){
			var self = this;
			
			el.addClass('gs-real');
			
			if(this.opts.debugColor){
				el.css('background-color',jstack.randomColor());
			}
			
			var rows = el.find('.gs-row');
			if(rows.length){
				el.addClass('gs-nested');
			}
			
			el.prepend('<div class="gs-margin gs-margin-left" />');
			el.append('<div class="gs-margin gs-margin-right" />');
			el.on('mouseover',function(){
				self._setMargin(el);
			});
			
			this.sortable(rows);
			
			el.resizable(this.opts.resizable);
			self.container.trigger('gs:added');
		},
		add: function(el,width,container){
			this.prepareAdd(el,width,container);
			this.handleAdd(el);
		},
		
		_setMarginHeight: function(col){
			var self = this;
			var ml = col.find('>.gs-margin-left');
			var mr = col.find('>.gs-margin-right');
			var h = col.find('>.gs-content').outerHeight() - 1;
			ml.height(h);
			mr.height(h);
		},
		_setMargin: function(col){
			var self = this;
			var row = col.closest('.gs-row');
			var ml = col.find('>.gs-margin-left');
			var mr = col.find('>.gs-margin-right');
			var l = self.left(col);
			var r = self.right(col);
			var wr = r ? self._rowWidth(row,r) : 0;
			var wl = l ? self._rowWidth(row,l) : 0;
			
			ml.css('left', (l ? (-1*wl) -1 : 0));
			ml.width(wl-1);
			
			mr.css('right', (r ? (-1*wr) -1 : 0));
			mr.width(wr-1);
			self._setMarginHeight(col);
		},
		
		widthMinus: function(col){
			return this.width( col, this.width(col)-1 );
		},
		widthPlus: function(col){
			return this.width( col, this.width(col)+1 );
		},
		width: function(col,width){
			if(width){
				var size = this.left(col)+width+this.right(col);
				if(size<=this.opts.width&&width>=1){
					var oldw = col.attr('data-gs-col');
					if(parseInt(oldw,10)!=width){
						col.attr('data-gs-col' ,width);
						col.trigger('gs:width:change');
					}
					this._afterWidth(col);
					return width;
				}
			}
			width = parseInt(col.attr('data-gs-col'),10) || 1;
			return width;
		},
		
		outerWidth: function(col){
			return this.left(col)+this.width(col)+this.right(col);
		},
		
		_afterWidth: function(col){
			var self = this;
			this._setMargin( col );
			var timeout;
			timeout = col.data('gs-width-timeout');
			if(timeout){
				clearTimeout(timeout);
			}
			timeout = setTimeout(function(){
				self._setMarginHeight( col );
				
			},this.opts.gsColTransitionWidth);
			col.data('gs-width-timeout',timeout);
		},
		
		leftMinus: function(col){
			return this.left( col, this.left(col)-1 );
		},
		leftPlus: function(col){
			return this.left( col, this.left(col)+1 );
		},
		rightMinus: function(col){
			return this.right( col, this.right(col)-1 );
		},
		rightPlus: function(col){
			return this.right( col, this.right(col)+1 );
		},
		
		left: function(col,offset){
			if(typeof(offset)!='undefined'&&offset!==false&&offset>=0){
				var size = offset+this.width(col)+this.right(col);
				if(size<=this.opts.width&&size>=1){
					col.attr('data-gs-left' ,offset);
					this._setMargin(col);
					return offset;
				}
			}
			offset = parseInt(col.attr('data-gs-left'),10) || 0;
			return offset;
		},
		right: function(col,offset){
			if(typeof(offset)!='undefined'&&offset!==false&&offset>=0){
				var size = this.left(col)+this.width(col)+offset;
				if(size<=this.opts.width&&size>=1){
					col.attr('data-gs-right' ,offset);
					this._setMargin(col);
					return offset;
				}
			}
			offset = parseInt(col.attr('data-gs-right'),10) || 0;
			return offset;
		},
		
		remove: function(col){
			var defer = $.Deferred();
			var self = this;
			col.animate({
				opacity: 'hide',
				width: 'hide',
				height: 'hide'
			}, 400, function() {
				col.remove();
				self.container.trigger('gs:remove',col);
				defer.resolve();
			});
			return defer;
		},
	};
	
	$.fn.gridstrap = function(opts) {
		return this.each(function() {
			var o = $(this);
			if (!o.data('gridstrap')) {
				o.data('gridstrap', new Gridstrap(this, opts));
			}
		});
	};
	
	$.fn.gridstrapDraggable = function(options){
		if(arguments.length>1){
			return this.draggable.apply(this,arguments);
		}
		return this.each(function(){
			var $this = $(this);
			var connectToSortable = $this.attr('data-gs-accepted-container') || '.gs-row';
			$this
				.draggable($.extend(true,{
					cursor:'grabbing',
					scroll: true,
					revert: 'invalid',
					connectToSortable: connectToSortable,
					helper: 'clone',
					appendTo: document.body,
					zIndex: 99999,
				},options));
		});
	};
	
})(jQuery);