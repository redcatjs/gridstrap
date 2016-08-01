(function($){

	var Gridstrap = function(el, opts) {
		var self = this;
		this.container = $(el);
		this.opts = $.extend(opts || {}, {
			width: 12,
			cellHeight: 80,
			itemClass: 'grid-strap-item',
            placeholderClass: 'grid-strap-placeholder',
            //handle: '.grid-strap-item-content',
		});

		this.placeholder = $(
			'<div class="' + this.opts.placeholderClass + ' ' + this.opts.itemClass + '">' +
			'<div class="placeholder-content"></div></div>'
		);
		this.placeholder.hide();
		
		$(document).resize(function(){
			self.container.sortable("option", "grid", self.getGridIntervals());
		});
		
		self.container.sortable({
			helper: 'clone',
			revert: 'invalid',
			grid: self.getGridIntervals(),
			placeholder: this.opts.placeholderClass,
			change: function(event, ui) {
				ui.placeholder.css({visibility: 'visible', border : '1px solid yellow'});
			},
			over: function(e, ui){
				
			},
			out: function(e, ui){
				
			},
			receive: function(e, ui){
				
			},
		});
		
	};
	
	Gridstrap.prototype.addWidget = function(el,x,y,width,height){
		el.attr('data-gs-x',x);
		el.attr('data-gs-y',y);
		el.attr('data-gs-width',width);
		el.attr('data-gs-height',height);
		el.addClass('grid-strap-item');
		this.container.append(el);
		this.container.sortable('refresh');
	};
	Gridstrap.prototype.removeWidget = function(el){
		el.remove();
		this.container.sortable('refresh');
	};
	Gridstrap.prototype.getGridIntervals = function(el){
		var x = this.container.width/this.opts.width;
		var y = this.opts.cellHeight;
		return [ x, y ];
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
