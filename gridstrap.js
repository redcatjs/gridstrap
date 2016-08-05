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
		
		//create col controls
		container.find('[data-col]').each(function() {
			var col = $(this);
			if (col.find('> .gs-tools-drawer').length) { return; }
			
			//col.addClass('col-md-'+col.attr('data-col'));
			
			var drawer = $('<div class="gs-tools-drawer" />').prependTo(col);

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
		
		var sortStart = function(e, ui){
			ui.placeholder.css({
				height: ui.item.outerHeight(),
				width: ui.item.outerWidth(),
				background: '#0f0',
				//position: 'absolute',
			});
		};
		
		//make sortable
		container.find('.gs-row').each(function(){
			$(this).sortable({
				items: '> [data-col]',
				connectWith: '.gs-canvas .gs-row',
				start: sortStart,
				//helper: 'clone',
				placeholder: 'gs-sortable-placeholder',
				grid: self.getGridIntervals(this),
				//axis: "x"
			});
		});
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
	
	Gridstrap.prototype.widthMinus = function(col){
		var size = (parseInt(col.attr('data-col'),10) || 1) - 1;
		if(size<1) return;
		this.width(col,size);
	};
	Gridstrap.prototype.widthPlus = function(col){
		var size = (parseInt(col.attr('data-col'),10) || 1) + 1;
		if(size>self.opts.width) return;
		this.width(col,size);
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
	
	$.fn.gridstrap = function(opts) {
		return this.each(function() {
			var o = $(this);
			if (!o.data('gridstrap')) {
				o.data('gridstrap', new Gridstrap(this, opts));
			}
		});
	};

})(jQuery);
