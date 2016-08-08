(function($){

	var Gridstrap = function(el, opts) {
		this.container = $(el);
		this.opts = $.extend({
			width: 12,
			cellHeight: 80,
			defaultWidth: 3,
		}, opts || {} );
		
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
		
        self.init();

	};
	
	Gridstrap.prototype.init = function(){
		var self = this;
		var container = this.container;
		
		//make sortable
		container.find('.gs-row').each(function(){
			var row = $(this);
			var items = '> [data-col]';
			$(this).sortable({
				items: items,
				connectWith: '.gridstrap .gs-row',
				revert: 400,
				tolerance: 'pointer',
				placeholder: 'gs-sortable-placeholder',
				//helper: 'clone',
				start: function(e, ui){
					ui.placeholder.css({
						height: ui.item.outerHeight(),
						width: ui.item.outerWidth(),
					});
					
					ui.item.addClass('gs-moving');
					row.find(items).filter(':not(.gs-moving, .gs-cloned)').each(function(){
						var item = $(this);
						var position = item.position();
						var clone = item.clone();
						item.data('clone',clone);
						clone.addClass('gs-cloned');
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
					
					row.find(items).filter(':not(.gs-moving, .gs-cloned)').each(function(){
						var item = $(this);
						var position = item.position();
						var clone = item.data('clone');
						clone.css({
							top: position.top,
							left: position.left,
						});
					});
					
				},
				stop: function(e, ui){
					
					row.find(items).filter(':not(.gs-moving, .gs-cloned)').each(function(){
						var item = $(this);
						var clone = item.data('clone');
						item.css('visibility','visible');
						clone.hide();
						clone.remove();
					});

				},
				over: function(e, ui){
					
					
				},
			});
		});
	};
	
	Gridstrap.prototype.addWidget = function(el,width,container){
		if(!width){
			width = el.attr('data-col') || this.defaultWidth;
		}
		el.attr('data-col',width);
		el.addClass('gridstrap-item');
		if(!container){
			container = this.container;
		}
		container.append(el);

		this.init();
		//this.container.sortable('refresh');
	};
	//Gridstrap.prototype.removeWidget = function(el){
		//el.remove();
		//this.container.sortable('refresh');
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
