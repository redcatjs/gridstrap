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
					self._resizeCallback(this,ui,e);
				},
				stop: function(){
					$(this).css('width','');
					$(this).trigger('gs-resized');
				}
			},
			boxPadding: 15, //$box-padding .gs-col and .gs-placeholder horizontal padding for autoAdjustWidth calculation
			gsColTransitionWidth: 400, //$gs-col-transition-width .gs-col{ transition width duration }, .gs-margin{ transition width left }
			gsColPaddingTop: 5, //.gs-col{ padding-top }
			debugEvents: false,
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
		
		this._hanldeSortable(rootRow);
	};
	
	Gridstrap.prototype._resizeCallback = function(el,ui,e){
		var $this = $(el);
		var containerW = $this.parent().innerWidth();
		var colW = containerW/self.opts.width;
		var col = Math.ceil( ui.size.width/colW );
		$this.addClass('no-transition');
		$this.attr('data-col', col );
		$this.css('width', '');
		$this.removeClass('no-transition');
		$this.trigger('gs-resizing');
	};
	
	Gridstrap.prototype._rowWidth = function(row, n){
		return row.width() * n/this.opts.width - this.opts.boxPadding*2;
	};
	
	Gridstrap.prototype._makeTempItems = function(row){
		var self = this;
		row.find(self.itemsSelector).each(function(){
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
	Gridstrap.prototype._updateTempItems = function(row){
		var self = this;
		row.find(self.itemsSelector).each(function(){
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
	Gridstrap.prototype._cleanTempItems = function(row){
		var self = this;
		row.find(self.itemsSelector).each(function(){
			var item = $(this);
			var clone = item.data('gs-clone');
			if(clone){
				clone.remove();
				item.data('gs-clone',false);
			}
			item.css('opacity',1);
		});
	};
	
	Gridstrap.prototype._disableTargets = function(row,ui){
		var self = this;
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
	Gridstrap.prototype._reenableTargets = function(row,ui){
		var self = this;
		$('.gs-row.ui-sortable',self.container).each(function(){
			var $this = $(this);
			if($this.closest('.gs-clone').length) return;
			$this.sortable('enable');
			row.sortable('refresh');
		});
	};
	Gridstrap.prototype._autoAdjustWidth = function(row,ui){
		var self = this;
		var w = self._rowWidth(row,self.width(ui.item));
		ui.placeholder.width( w );
		ui.item.width( w );
	};
	Gridstrap.prototype._autoAdjustHeightInit = function(row,ui){		
		var self = this;
		var tempContainer = $('<div style="position:absolute;visibility:hidden;"></div>').appendTo(document.body);
		var clone = ui.item.clone();
		clone.css('height','auto');
		tempContainer.append(clone);
		var h = clone.height();
		tempContainer.remove();
		ui.item.data('gs-auto-height',h);
	};
	Gridstrap.prototype._autoAdjustHeight = function(row,ui){		
		var self = this;
		self._attribDataRow(row, ui);
		var hOrigin = row.find('[data-row="'+ui.item.attr('data-row')+'"]:not(.gs-placeholder)').eq(0).height();
		h = Math.max(hOrigin,ui.item.data('gs-auto-height'));
		ui.item.height(h);
		ui.placeholder.height(h);
	};
	Gridstrap.prototype._hanldeSortable = function(rows){
		var self = this;
		rows.each(function(){
			var row = $(this);
			var autoHeightTimeout;
			if(row.hasClass('ui-sortable')){
				row.sortable('refresh');
				return;
			}
			row.sortable({
				items: self.itemsSelector,
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
					if(self.opts.debugEvents) console.log('start',this);
					
					self._autoAdjustHeightInit(row,ui);
					
					ui.placeholder.css({
						height: ui.item.height(),
						width: ui.item.width(),
					});
					ui.placeholder.html('<div class="gs-content"></div>');
					ui.item.addClass('gs-moving');
					
					self._disableTargets(row, ui);
					self._makeTempItems(row);
					
				},
				over: function(e, ui){
					if(self.opts.debugEvents) console.log('over',this);
					
					ui.item.parents('.gs-col').addClass('gs-moving-parent');
					$(this).addClass('gs-moving-parent').parents('.gs-col').addClass('gs-moving-parent');
					
					self._autoAdjustWidth(row, ui);
					self._autoAdjustHeight(row,ui);
				},
				change: function(e, ui){
					if(self.opts.debugEvents) console.log('change',this);
					
					$(ui.item).data('gs-changed',true);
					row.data('gs-changed',true);

					self._updateTempItems(row);
					
					self._autoAdjustHeight(row,ui);
				},
				out: function(e, ui){
					if(self.opts.debugEvents) console.log('out',this);
					self._cleanTempItems(row);
					$(this).removeClass('gs-moving-parent').parents('.gs-col').removeClass('gs-moving-parent');
				},
				stop: function(e, ui){
					if(self.opts.debugEvents) console.log('stop',this);
					$(ui.item).data('gs-changed',false);
					row.data('gs-changed',false);
					self._reenableTargets(row, ui);
					self.container.find('.gs-moving-parent').removeClass('gs-moving-parent');
				},
				update: function(e, ui){
					if(self.opts.debugEvents) console.log('update',this);
				},
				activate: function(e, ui){
					if(self.opts.debugEvents) console.log('activate',this);
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
					if(self.opts.debugEvents) console.log('deactivate',this);
					$(this).removeClass('gs-state-highlight');
					row.find('.gs-moving').removeClass('gs-moving');
				},
				beforeStop: function(e, ui){
					if(self.opts.debugEvents) console.log('beforeStop',this);
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
				sort: function(event, ui){					
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
	
	Gridstrap.prototype._getCurrentOrderedCols = function(row,ui){
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
	
	Gridstrap.prototype._attribDataRow = function(row,ui){
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
		this._hanldeSortable(container);
	};
	Gridstrap.prototype.handleAdd = function(el){
		var self = this;
		
		var rows = el.find('.gs-row');
		if(rows.length){
			el.addClass('gs-nested');
		}
		
		el.prepend('<div class="gs-margin gs-margin-left" />');
		el.append('<div class="gs-margin gs-margin-right" />');
		el.on('mouseover',function(){
			self._setMargin(el);
		});
		
		this._hanldeSortable(rows);
		
		el.resizable(this.opts.resizable);
	};
	Gridstrap.prototype.add = function(el,width,container){
		this.prepareAdd(el,width,container);
		this.handleAdd(el);
	};
	
	Gridstrap.prototype._setMarginHeight = function(col){
		var self = this;
		var ml = col.find('>.gs-margin-left');
		var mr = col.find('>.gs-margin-right');
		var h = col.find('>.gs-content').outerHeight();
		ml.height(h);
		mr.height(h);
	};
	Gridstrap.prototype._setMargin = function(col){
		var self = this;
		var row = col.closest('.gs-row');
		var ml = col.find('>.gs-margin-left');
		var mr = col.find('>.gs-margin-right');
		var l = self.left(col);
		var r = self.right(col);
		var wr = r ? self._rowWidth(row,r) : 0;
		var wl = l ? self._rowWidth(row,l) : 0;
		
		ml.css({
			top : self.opts.gsColPaddingTop,
			left: (l ? (-1*wl) - self.opts.boxPadding : 0),
		});
		ml.width(wl);
		
		mr.css({
			top : self.opts.gsColPaddingTop,
			right: (r ? (-1*wr) - self.opts.boxPadding : 0),
		});
		mr.width(wr);
		self._setMarginHeight(col);
	};
	
	Gridstrap.prototype.widthMinus = function(col){
		return this.width( col, this.width(col)-1 );
	};
	Gridstrap.prototype.widthPlus = function(col){
		return this.width( col, this.width(col)+1 );
	};
	Gridstrap.prototype.width = function(col,width){
		var self = this;
		if(width){
			var size = this.left(col)+width+self.right(col);
			if(size<=this.opts.width&&width>=1){
				col.attr('data-col' ,width);
				self._afterWidth(col);
				return width;
			}
		}
		width = parseInt(col.attr('data-col'),10) || 1;
		return width;
	};
	
	Gridstrap.prototype._afterWidth = function(col){
		var self = this;
		self._setMargin( col );
		var timeout;
		timeout = col.data('gs-width-timeout');
		if(timeout){
			clearTimeout(timeout);
		}
		timeout = setTimeout(function(){
			self._setMarginHeight( col );
			
		},self.opts.gsColTransitionWidth);
		col.data('gs-width-timeout',timeout);
	};
	
	Gridstrap.prototype.leftMinus = function(col){
		return this.left( col, this.left(col)-1 );
	};
	Gridstrap.prototype.leftPlus = function(col){
		return this.left( col, this.left(col)+1 );
	};
	Gridstrap.prototype.rightMinus = function(col){
		return this.right( col, this.right(col)-1 );
	};
	Gridstrap.prototype.rightPlus = function(col){
		return this.right( col, this.right(col)+1 );
	};
	
	Gridstrap.prototype.left = function(col,offset){
		if(typeof(offset)!='undefined'&&offset!==false&&offset>=0){
			var size = offset+this.width(col)+this.right(col);
			if(size<=this.opts.width&&size>=1){
				col.attr('data-left' ,offset);
				this._setMargin(col);
				return offset;
			}
		}
		offset = parseInt(col.attr('data-left'),10) || 0;
		return offset;
	};
	Gridstrap.prototype.right = function(col,offset){
		if(typeof(offset)!='undefined'&&offset!==false&&offset>=0){
			var size = this.left(col)+this.width(col)+offset;
			if(size<=this.opts.width&&size>=1){
				col.attr('data-right' ,offset);
				this._setMargin(col);
				return offset;
			}
		}
		offset = parseInt(col.attr('data-right'),10) || 0;
		return offset;
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
