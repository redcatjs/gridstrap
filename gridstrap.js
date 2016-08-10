(function($){

	var Gridstrap = function(el, opts) {
		this.container = $(el);
		this.opts = $.extend({
			width: 12,
			cellHeight: 80,
			defaultWidth: 3,
		}, opts || {} );
		this.itemsSelector = '> [data-col]';
		
		var self = this;
		var container = this.container;
		
		container.addClass('gs-editing');
		container.addClass('gridstrap');

		//$(document)
			//.on('click', '.gm-preview', function() {
				//if(!self.hasClass('gs-editing')) {
					//self.addClass('gs-editing');
					//$(this).addClass('active');
				//}
				//else{
					//self.removeClass('gs-editing');
					//$(this).removeClass('active');
				//}
			//})
		//;
		
		container.on('mouseover.gs', '.gs-col', function(e){
			if(e.stopNamespacePropagation) return;
			e.stopNamespacePropagation = true;
			$(this).addClass('mouseover');
		}).on('mouseout.gs', '.gs-col', function(e){
			if(e.stopNamespacePropagation) return;
			e.stopNamespacePropagation = true;
			$(this).removeClass('mouseover');
		});
		
		this.sortable(container);
	};
	
	Gridstrap.prototype.virtualRows = function(cols){
		var self = this;
		var currentRow = 1;
		var ttWidth = 0;
		cols.each(function(){
			var $this = $(this);
			ttWidth += self.width( $this );
			if(ttWidth>self.opts.width){
				ttWidth = 0;
				currentRow += 1;
				$this.css('clear','left');
			}
			else{
				$this.css('clear','none');
			}
		});
		
	};
	Gridstrap.prototype.sortable = function(row){
		var self = this;
		var container = this.container;
		var items = self.itemsSelector;		
		if(row.hasClass('ui-sortable')){
			row.sortable('refresh');
			return;
		}
		row.sortable({
			items: items,
			connectWith: '.gridstrap .gs-row',
			revert: 400,
			tolerance: 'pointer',
			placeholder: 'gs-placeholder',
			//helper: 'clone',
			start: function(e, ui){
				ui.placeholder.css({
					height: ui.item.outerHeight(),
					width: ui.item.outerWidth(),
				});
				
				ui.item.addClass('gs-moving');
				
				
				row.find(items).filter(':not(.gs-moving, .gs-clone)').each(function(){
					var item = $(this);
					var position = item.position();
					var clone = item.clone();
					item.data('gs-clone',clone);
					clone.addClass('gs-clone');
					clone.css({
						position: 'absolute',
						top: position.top,
						left: position.left,
					});
					item.after(clone);
					item.css('visibility','hidden');
				});
			},
			change: function(e, ui){
				var sCols = [];
				var cols = row.closest('.gs-content').find('> .gs-row').find('> .gs-placeholder, > .gs-col:not(.gs-moving, .gs-clone)');
				
				cols.each(function(){
					if(this===ui.placeholder[0]){
						sCols.push( ui.item );
					}
					else{
						sCols.push( $(this) );
					}
				});
				console.log(sCols);
				
				//$(sCols).each(function(i){
					//$(this).html('<div style="font-size:50px;">'+i+'</div>');
				//});
				
				self.virtualRows( $(sCols) );

				row.find(items).filter(':not(.gs-moving, .gs-clone)').each(function(){
					var item = $(this);
					var position = item.position();
					var clone = item.data('gs-clone');
					clone.css({
						top: position.top,
						left: position.left,
					});
				});
				
			},
			stop: function(e, ui){
				row.find(items).filter(':not(.gs-moving, .gs-clone)').each(function(){
					var item = $(this);
					var clone = item.data('gs-clone');
					item.css('visibility','visible');
					clone.hide();
					clone.remove();
				});
				row.closest('.gs-content').find('.gs-moving').removeClass('gs-moving');

			},
			update: function(e, ui){
				
			},
			over: function(e, ui){
				
				
			},
		});
	};
	
	Gridstrap.prototype.addWidget = function(el,width,container){
		if(!width){
			width = el.attr('data-col') || this.defaultWidth;
		}
		el.attr('data-col',width);
		el.addClass('gs-col');
		if(!container){
			container = this.container;
		}
		container.append(el);

		this.virtualRows(container.find('> .gs-col'));
		this.sortable(container);
		
		var rows = el.find('.gs-row');
		this.virtualRows(rows.find('> .gs-col'));
		rows.each(function(){
			self.sortable( $(this) );
		});
		
	};
	//Gridstrap.prototype.removeWidget = function(el){
		//el.remove();
	//};
	
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
		col.animate({
			opacity: 'hide',
			width: 'hide',
			height: 'hide'
		}, 400, function() {
			col.remove();
		});
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
