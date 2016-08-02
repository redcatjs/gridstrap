(function($){

	var Gridstrap = function(el, opts) {
		this.container = $(el);
		this.opts = $.extend(opts || {}, {
			
		});
		
		var self = this;
		var container = this.container;
		
		container.addClass('ge-canvas');
		container.addClass('ge-editing');

		//$(document)
			//.on('click', '.gm-preview', function() {
				//$(this).toggleClass('active btn-danger').trigger('mouseleave');
			//})
			//.on('mouseenter', '.gm-preview', function() {
				//container.removeClass('ge-editing');
			//})
			//.on('mouseleave', '.gm-preview', function() {
				//if (!$(this).hasClass('active')) {
					//container.addClass('ge-editing');
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
		container.find('.row').each(function() {
			var row = $(this);
			if (row.find('> .ge-tools-drawer').length) { return; }

			var drawer = $('<div class="ge-tools-drawer" />').prependTo(row);
			self.createTool(drawer, 'Move', 'ge-move', 'fa fa-move');
			self.createTool(drawer, 'Remove row', '', 'fa fa-close', function() {
				row.slideUp(function() {
					row.remove();
				});
			});
			self.createTool(drawer, 'Add column', 'ge-add-column', 'fa fa-plus-circle', function() {
				row.append('<div data-col="3" />');
				self.init();
			});
		});
		
		//create col controls
		container.find('[data-col]').each(function() {
			var col = $(this);
			if (col.find('> .ge-tools-drawer').length) { return; }
			
			//col.addClass('col-md-'+col.attr('data-col'));
			
			var drawer = $('<div class="ge-tools-drawer" />').prependTo(col);

			self.createTool(drawer, 'Move', 'ge-move', 'fa fa-arrows');

			self.createTool(drawer, 'Make column narrower\n(hold shift for min)', 'ge-decrease-col-width', 'fa fa-minus', function(e) {
				var size = (parseInt(col.attr('data-col'),10) || 1) - 1;
				if(size<1) return;
				col.attr('data-col' ,size);
			});

			self.createTool(drawer, 'Make column wider\n(hold shift for max)', 'ge-increase-col-width', 'fa fa-plus', function(e) {
				var size = (parseInt(col.attr('data-col'),10) || 1) + 1;
				if(size>12) return;
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

			self.createTool(drawer, 'Add row', 'ge-add-row', 'fa fa-plus-circle', function() {
				var row = $('<div class="row" />');
				col.append(row);
				row.append('<div data-col="6" /><div data-col="6" />');
				self.init();
			});

			var details = $('<div class="details" />').appendTo(drawer);
		});
		
		
		//make sortable
		container.find('.row').sortable({
			items: '> [data-col]',
			connectWith: '.ge-canvas .row',
			handle: '> .ge-tools-drawer .ge-move',
			start: sortStart,
			helper: 'clone',
		});
		container.add(container.find('[data-col]')).sortable({
			items: '> .row',
			connectsWith: '.ge-canvas, .ge-canvas [data-col]',
			handle: '> .ge-tools-drawer .ge-move',
			start: sortStart,
			helper: 'clone',
		});

		function sortStart(e, ui) {
			ui.placeholder.css({ height: ui.item.outerHeight()});
		}
	};
	
	Gridstrap.prototype.addWidget = function(el,width){
		el.attr('data-col',width);
		this.container.append(el);
		
		this.init();
		//this.container.sortable('refresh');
	};
	//Gridstrap.prototype.removeWidget = function(el){
		//el.remove();
		//this.container.sortable('refresh');
	//};
	
	
	$.fn.gridstrap = function(opts) {
		return this.each(function() {
			var o = $(this);
			if (!o.data('gridstrap')) {
				o.data('gridstrap', new Gridstrap(this, opts));
			}
		});
	};

})(jQuery);
