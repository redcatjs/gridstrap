(function($){

	var Gridstrap = function(el, opts) {
		this.container = $(el);
		this.opts = $.extend(opts || {}, {
			width: 12,
			cellHeight: 80,
		});
		
		var self = this;
		var container = this.container;
		
		container.addClass('gs-canvas');
		container.addClass('gs-editing');

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
	
	Gridstrap.prototype.createTool = function(drawer, title, className, iconClass, eventHandlers){
		var tool = $('<a title="' + title + '" class="' + className + '"><span class="' + iconClass + '"></span></a>')
			.appendTo(drawer)
		;
		if (typeof eventHandlers == 'function') {
			tool.on('click', eventHandlers);
		}
		if (typeof eventHandlers == 'object') {
			$.each(eventHandlers, function(name, func) {
				tool.on(name, func);
			});
		}
		
	};
	Gridstrap.prototype.init = function(){
		var self = this;
		var container = this.container;
		
		//create row controls
		//container.find('.gs-row').each(function() {
			//var row = $(this);
			//if (row.find('> .gs-tools-drawer').length) { return; }

			//var drawer = $('<div class="gs-tools-drawer" />').prependTo(row);
			//self.createTool(drawer, 'Move', 'gs-move', 'fa fa-move');
			//self.createTool(drawer, 'Remove row', '', 'fa fa-close', function() {
				//row.slideUp(function() {
					//row.remove();
				//});
			//});
			//self.createTool(drawer, 'Add column', 'gs-add-column', 'fa fa-plus-circle', function() {
				//row.append('<div data-col="3" />');
				//self.init();
			//});
		//});
		
		//create col controls
		container.find('[data-col]').each(function() {
			var col = $(this);
			if (col.find('> .gs-tools-drawer').length) { return; }
			
			//col.addClass('col-md-'+col.attr('data-col'));
			
			var drawer = $('<div class="gs-tools-drawer" />').prependTo(col);

			self.createTool(drawer, 'Move', 'gs-move', 'fa fa-arrows');

			self.createTool(drawer, 'Make column narrower\n(hold shift for min)', 'gs-decrease-col-width', 'fa fa-minus', function(e) {
				var size = (parseInt(col.attr('data-col'),10) || 1) - 1;
				if(size<1) return;
				col.attr('data-col' ,size);
			});

			self.createTool(drawer, 'Make column wider\n(hold shift for max)', 'gs-increase-col-width', 'fa fa-plus', function(e) {
				var size = (parseInt(col.attr('data-col'),10) || 1) + 1;
				if(size>self.opts.width) return;
				col.attr('data-col' ,size);
			});

			self.createTool(drawer, 'Settings', '', 'fa fa-pencil', function() {
				details.toggle();
			});
			
			self.createTool(drawer, 'Remove col', '', 'fa fa-close', function() {
				col.animate({
					opacity: 'hide',
					width: 'hide',
					height: 'hide'
				}, 400, function() {
					col.remove();
				});
			});

			self.createTool(drawer, 'Add col', 'gs-add-col', 'fa fa-plus-circle', function() {
				col.find('.gs-row').append('<div data-col="6" />');
				self.init();
			});

			var details = $('<div class="details" />').appendTo(drawer);
		});
		
		
		//make sortable
		container.find('.gs-row').each(function(){
			$(this).sortable({
				items: '> [data-col]',
				connectWith: '.gs-canvas .gs-row',
				handle: '> .gs-tools-drawer .gs-move',
				start: sortStart,
				helper: 'clone',
				grid: self.getGridIntervals(this),
			});
		});

		function sortStart(e, ui) {
			ui.placeholder.css({
				height: ui.item.outerHeight(),
				width: ui.item.outerWidth(),
				background: '#0f0',
				position: 'absolute',
			});
		}
	};
	
	Gridstrap.prototype.addWidget = function(el,width,container){
		el.attr('data-col',width);
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
	
	Gridstrap.prototype.getGridIntervals = function(el){
		var x = Math.floor( $(el).innerWidth()/this.opts.width );
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
