(function($){
	
	var _rearrange = $.ui.sortable.prototype._rearrange;
	$.widget('ui.sortable',$.extend($.ui.sortable.prototype,{
		_rearrange: function( event, i, a, hardRefresh ) {
			if(!( !a&&!i.item[ 0 ].parentNode ))
				return _rearrange.apply(this,arguments);
		},
	}));
	
	var Gridstrap = function(el, opts) {
		this.container = $(el);
		var self = this;
		var container = this.container;
		
		this.opts = $.extend(true,{
			width: 12,
			cellHeight: 80,
			defaultWidth: 3,
			connectWith: '.gridstrap:visible .gs-col:not(.gs-clone) .gs-row',
			scroll: true,
			scrollParent: false,
			scrollCallback: false,
			resizable:{
				handles: 'e',
				resize:function(e,ui){
					self.resizeCallback(this,ui,e);
				},
				stop: function(){
					$(this).css('width','');
					$(this).trigger('gs-resized');
				}
			},
			boxPadding: 30, //15*2 .gs-col and .gs-placeholder horizontal padding for autoAdjustWidth calculation
		}, opts || {} );
		this.itemsSelector = '> .gs-col:not(.gs-clone, .gs-moving)';
		
		container.addClass('gs-editing');
		container.addClass('gridstrap');
		
		container.on('mouseover.gs', '.gs-col', function(e){
			if(e.stopNamespacePropagation) return;
			e.stopNamespacePropagation = true;
			$(this).addClass('mouseover');
		}).on('mouseout.gs', '.gs-col', function(e){
			if(e.stopNamespacePropagation) return;
			e.stopNamespacePropagation = true;
			$(this).removeClass('mouseover');
		});
		
		var rootRow = container.find('>.gs-row');
		if(!rootRow.length){
			rootRow = $('<div class="gs-row" />').appendTo(container);
		}
		
		this.hanldeSortable(rootRow);
	};
	
	Gridstrap.prototype.resizeCallback = function(el,ui,e){
		var $this = $(el);
		var containerW = $this.parent().innerWidth();
		var colW = containerW/12;
		var col = Math.ceil( ui.size.width/colW );
		$this.addClass('no-transition');
		$this.attr('data-col', col );
		$this.css('width', '');
		$this.removeClass('no-transition');
		$this.trigger('gs-resizing');
	};
	
	Gridstrap.prototype.hanldeSortable = function(rows){
		var self = this;
		var container = this.container;
		var items = self.itemsSelector;
		var makeTempItems = function(row){
			row.find(items).each(function(){
				var item = $(this);
				if(item.data('gs-clone')) return;
				var position = item.position();
				var clone = item.clone();
				item.data('gs-clone',clone);
				clone.addClass('gs-clone');
				clone.css({
					position: 'absolute',
					top: position.top,
					left: position.left,
					height: item.outerHeight(),
					'z-index': 4,
				});	
				item.after(clone);
				item.css('opacity',0);
			});
			row.sortable('refresh');
		};
		var updateTempItems = function(row){
			row.find(items).each(function(){
				var item = $(this);
				var clone = item.data('gs-clone');
				if(clone){
					var position = item.position();
					clone.css({
						top: position.top,
						left: position.left,
						height: item.outerHeight(),
					});
				}
			});
		};
		var cleanTempItems = function(row){
			row.find(items).each(function(){
				var item = $(this);
				var clone = item.data('gs-clone');
				if(clone){
					clone.remove();
					item.data('gs-clone',false);
				}
				item.css('opacity',1);
			});
		};
		var disableTargets = function(row,ui){
			var el = ui.item;
			var accepted = el.attr('data-gs-accepted-container');
			var rowCol = row.closest('.gs-col');
			$('.gs-row.ui-sortable',self.container).each(function(){
				var $this = $(this);
				if($this.closest('.gs-clone').length) return;
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
		};
		var reenableTargets = function(row,ui){
			$('.gs-row.ui-sortable',self.container).each(function(){
				var $this = $(this);
				if($this.closest('.gs-clone').length) return;
				$this.sortable('enable');
				row.sortable('refresh');
			});
		};
		var autoAdjustWidth = function(row, ui){
			var w = row.innerWidth() * parseInt(ui.item.attr('data-col'),10)/12 - self.opts.boxPadding;
			ui.placeholder.width( w );
			ui.item.width( w );
		};
		var autoAdjustHeightInit = function(row, ui){
			var tempContainer = $('<div style="position:absolute;visibility:hidden;"></div>').appendTo(document.body);
			var clone = ui.item.clone();
			clone.css('height','auto');
			tempContainer.append(clone);
			var h = clone.height();
			tempContainer.remove();
			ui.item.data('gs-auto-height',h);
		};
		var autoAdjustHeight = function(row, ui){
			self.attribDataRow(row, ui);
			var hOrigin = row.find('[data-row="'+ui.item.attr('data-row')+'"]:not(.gs-placeholder)').eq(0).height();
			h = Math.max(hOrigin,ui.item.data('gs-auto-height'));
			ui.item.height(h);
			ui.placeholder.height(h);
		};
		rows.each(function(){
			var row = $(this);
			var autoHeightTimeout;
			if(row.hasClass('ui-sortable')){
				row.sortable('refresh');
				return;
			}
			row.sortable({
				items: items,
				connectWith: self.opts.connectWith,
				revert: 200,
				scroll: self.opts.scroll,
				scrollSensitivity: 100, //default 20
				scrollSpeed: 50, //default 20
				delay: 50,
				tolerance: 'pointer',
				placeholder: 'gs-placeholder',
				appendTo: document.body,
				start: function(e, ui){
					//console.log('start',this);
					
					autoAdjustHeightInit(row,ui);
					
					ui.placeholder.css({
						height: ui.item.height(),
						width: ui.item.width(),
					});
					ui.placeholder.html('<div class="gs-content"></div>');
					ui.item.addClass('gs-moving');
					
					disableTargets(row, ui);
					makeTempItems(row);
					
				},
				over: function(e, ui){
					//console.log('over',this);
					ui.item.parents('.gs-col').addClass('gs-moving-parent');
					$(this).addClass('gs-moving-parent').parents('.gs-col').addClass('gs-moving-parent');
					
					autoAdjustWidth(row, ui);
					autoAdjustHeight(row,ui);
				},
				change: function(e, ui){
					//console.log('change',this);
					
					$(ui.item).data('gs-changed',true);
					row.data('gs-changed',true);

					updateTempItems(row);
					
					autoAdjustHeight(row,ui);
				},
				out: function(e, ui){
					//console.log('out',this);
					cleanTempItems(row);
					$(this).removeClass('gs-moving-parent').parents('.gs-col').removeClass('gs-moving-parent');
				},
				stop: function(e, ui){
					//console.log('stop',this);
					$(ui.item).data('gs-changed',false);
					row.data('gs-changed',false);
					reenableTargets(row, ui);
					self.container.find('.gs-moving-parent').removeClass('gs-moving-parent');
				},
				update: function(e, ui){
					//console.log('update',this);
				},
				activate: function(e, ui){
					//console.log('activate',this);
					$(this).addClass('gs-state-highlight');
					
					var parentCol = $(this).closest('.gs-col');
					if(parentCol.length){
						var parentClone = parentCol.data('gs-clone');
						if(parentClone){
							parentClone.find('>.gs-content>.gs-row').addClass('gs-state-highlight');
						}
					}
				},
				deactivate: function(e, ui){
					//console.log('deactivate');
					$(this).removeClass('gs-state-highlight');
					row.find('.gs-moving').removeClass('gs-moving');
				},
				beforeStop: function(e, ui){
					//console.log('beforeStop',this);
				},
				create: function(e, ui){
					//console.log('create',this);
				},
				receive: function(e, ui){
					//console.log('receive',this);
				},
				remove: function(e, ui){
					//console.log('remove',this);
				},
				sort: function(event, ui){
					//console.log('sort',this);
					
					if(self.opts.scrollCallback){						
						var o = row.sortable('option');
						var scrollParent = self.opts.scrollParent || row.scrollParent();
						
						if(typeof(scrollParent)=='function'){
							scrollParent = scrollParent(row);
						}
						
						var overflowOffset = scrollParent.offset();
						scrollParentEl = scrollParent[0];
						if( overflowOffset.top + scrollParentEl.offsetHeight - event.pageY < o.scrollSensitivity ){
							self.opts.scrollCallback(scrollParentEl.scrollTop + o.scrollSpeed, scrollParent);
						}
						else if( event.pageY - overflowOffset.top < o.scrollSensitivity ){
							self.opts.scrollCallback(scrollParentEl.scrollTop - o.scrollSpeed, scrollParent);
						}
					}
				},
			});
		});
	};
	
	Gridstrap.prototype.getCurrentOrderedCols = function(row,ui){
		var sCols = [];
		var cols = row.find('> .gs-placeholder, > .gs-col:not(.gs-moving, .gs-clone)');
		cols.each(function(){
			if(this===ui.placeholder[0]){
				sCols.push( ui.item );
			}
			else{
				sCols.push( $(this) );
			}
		});
		return $(sCols);
	};
	
	Gridstrap.prototype.attribDataRow = function(row,ui){
		var self = this;
		var cols = self.getCurrentOrderedCols(row,ui);
		var currentRow = 1;
		var ttWidth = 0;
		cols.each(function(){
			var $this = $(this);
			ttWidth += self.width( $this );
			if(ttWidth>self.opts.width){
				ttWidth = 0;
				currentRow++;
			}
			$this.attr('data-row',currentRow);
		});
	};
	
	Gridstrap.prototype.prepareAdd = function(el,width,container){
		var self = this;
		if(!width){
			width = el.attr('data-col') || this.defaultWidth;
		}
		el.attr('data-col',width);
		el.addClass('gs-col');
		if(!container){
			container = this.container;
		}
		container.append(el);
		this.hanldeSortable(container);
	};
	Gridstrap.prototype.handleAdd = function(el){
		var rows = el.find('.gs-row');
		if(rows.length){
			el.addClass('gs-nested');
		}
		
		this.hanldeSortable(rows);
		
		el.resizable(this.opts.resizable);
	};
	Gridstrap.prototype.add = function(el,width,container){
		this.prepareAdd(el,width,container);
		this.handleAdd(el);
	};
	
	Gridstrap.prototype.widthMinus = function(col){
		var size = (parseInt(col.attr('data-col'),10) || 1) - 1;
		if(size<1) size = 1;
		return this.width(col,size);
	};
	Gridstrap.prototype.widthPlus = function(col){
		var size = (parseInt(col.attr('data-col'),10) || 1) + 1;
		if(size>this.opts.width) size = this.opts.width;
		return this.width(col,size);
	};
	Gridstrap.prototype.width = function(col,size){
		if(size){
			col.attr('data-col' ,size);
		}
		else{
			size = parseInt(col.attr('data-col'),10) || 1;
		}
		return size;
	};
	Gridstrap.prototype.remove = function(col){
		var defer = $.Deferred();
		col.animate({
			opacity: 'hide',
			width: 'hide',
			height: 'hide'
		}, 400, function() {
			col.remove();
			defer.resolve();
		});
		return defer;
	};
	
	$.fn.gridstrap = function(opts) {
		return this.each(function() {
			var o = $(this);
			if (!o.data('gridstrap')) {
				o.data('gridstrap', new Gridstrap(this, opts));
			}
		});
	};

})(jQuery);
