(function($){

	var GridStrap = function(el, opts) {
		var self = this;
		this.container = $(el);
		this.opts = $.extend(opts || {}, {
			itemClass: 'grid-strap-item',
            placeholderClass: 'grid-strap-placeholder',
            //handle: '.grid-strap-item-content',
		});

		this.placeholder = $(
			'<div class="' + this.opts.placeholderClass + ' ' + this.opts.itemClass + '">' +
			'<div class="placeholder-content"></div></div>'
		);
		this.placeholder.hide();
		
		self.container.sortable({
			
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
