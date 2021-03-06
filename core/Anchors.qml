///Anchors, generic class to handle auto-adjusting positioning, used in Item
Object {
	property AnchorLine bottom;				///< bottom anchor line
	property AnchorLine verticalCenter;		///< target for vertical center
	property AnchorLine top;				///< top anchor line

	property AnchorLine left;				///< left anchor line
	property AnchorLine horizontalCenter;	///< target for horizontal center
	property AnchorLine right;				///< right anchor line

	property Item fill;		///< target to fill
	property Item centerIn;	///< target to place in center of it

	property int margins;		///< set all margins to same value
	property int bottomMargin;	///< bottom margin value
	property int topMargin;		///< top margin value
	property int leftMargin;	///< left margin value
	property int rightMargin;	///< right margin value

	signal marginsUpdated;		///< @private

	/** @private */
	function _updateLeft() {
		var anchors = this
		var self = anchors.parent
		var parent = self.parent

		var parent_box = parent.toScreen()
		var left = anchors.left.toScreen()

		var lm = anchors.leftMargin || anchors.margins
		self.x = left + lm - parent_box[0] - self.viewX
		if (anchors.right) {
			var right = anchors.right.toScreen()
			var rm = anchors.rightMargin || anchors.margins
			self.width = right - left - rm - lm
		}
	}

	/** @private */
	function _updateRight() {
		var anchors = this
		var self = anchors.parent
		var parent = self.parent

		var parent_box = parent.toScreen()
		var right = anchors.right.toScreen()

		var lm = anchors.leftMargin || anchors.margins
		var rm = anchors.rightMargin || anchors.margins
		if (anchors.left) {
			var left = anchors.left.toScreen()
			self.width = right - left - rm - lm
		}
		self.x = right - parent_box[0] - rm - self.width - self.viewX
	}

	/** @private */
	function _updateTop() {
		var anchors = this
		var self = anchors.parent
		var parent = self.parent

		var parent_box = parent.toScreen()
		var top = anchors.top.toScreen()

		var tm = anchors.topMargin || anchors.margins
		var bm = anchors.bottomMargin || anchors.margins
		self.y = top + tm - parent_box[1] - self.viewY
		if (anchors.bottom) {
			var bottom = anchors.bottom.toScreen()
			self.height = bottom - top - bm - tm
		}
	}

	/** @private */
	function _updateBottom() {
		var anchors = this
		var self = anchors.parent
		var parent = self.parent

		var parent_box = parent.toScreen()
		var bottom = anchors.bottom.toScreen()

		var tm = anchors.topMargin || anchors.margins
		var bm = anchors.bottomMargin || anchors.margins
		if (anchors.top) {
			var top = anchors.top.toScreen()
			self.height = bottom - top - bm - tm
		}
		self.y = bottom - parent_box[1] - bm - self.height - self.viewY
	}

	/** @private */
	function _updateHCenter() {
		var anchors = this
		var self = anchors.parent
		var parent = self.parent

		var parent_box = parent.toScreen();
		var hcenter = anchors.horizontalCenter.toScreen();
		var lm = anchors.leftMargin || anchors.margins;
		var rm = anchors.rightMargin || anchors.margins;
		self.x = hcenter - self.width / 2 - parent_box[0] + lm - rm - self.viewX;
	}

	/** @private */
	function _updateVCenter() {
		var anchors = this
		var self = anchors.parent
		var parent = self.parent

		var parent_box = parent.toScreen();
		var vcenter = anchors.verticalCenter.toScreen();
		var tm = anchors.topMargin || anchors.margins;
		var bm = anchors.bottomMargin || anchors.margins;
		self.y = vcenter - self.height / 2 - parent_box[1] + tm - bm - self.viewY;
	}

	///@private
	function _update(name) {
		var self = this.parent
		var anchors = this

		switch(name) {
			case 'left':
				self._removeUpdater('x')
				if (this.right)
					self._removeUpdater('width')
				var update_left = this._updateLeft.bind(this)
				update_left()
				self.connectOn(anchors.left.parent, 'boxChanged', update_left)
				anchors.onChanged('leftMargin', update_left)
				break

			case 'right':
				self._removeUpdater('x')
				if (this.left)
					self._removeUpdater('width')
				var update_right = this._updateRight.bind(this)
				update_right()
				self.onChanged('width', update_right)
				self.connectOn(anchors.right.parent, 'boxChanged', update_right)
				anchors.onChanged('rightMargin', update_right)
				break

			case 'top':
				self._removeUpdater('y')
				if (this.bottom)
					self._removeUpdater('height')
				var update_top = this._updateTop.bind(this)
				update_top()
				self.connectOn(anchors.top.parent, 'boxChanged', update_top)
				anchors.onChanged('topMargin', update_top)
				break

			case 'bottom':
				self._removeUpdater('y')
				if (this.top)
					self._removeUpdater('height')
				var update_bottom = this._updateBottom.bind(this)
				update_bottom()
				self.onChanged('height', update_bottom)
				self.connectOn(anchors.bottom.parent, 'boxChanged', update_bottom)
				anchors.onChanged('bottomMargin', update_bottom)
				break

			case 'horizontalCenter':
				self._removeUpdater('x')
				var update_h_center = this._updateHCenter.bind(this)
				update_h_center()
				self.onChanged('width', update_h_center)
				anchors.onChanged('leftMargin', update_h_center)
				anchors.onChanged('rightMargin', update_h_center)
				self.connectOn(anchors.horizontalCenter.parent, 'boxChanged', update_h_center)
				break

			case 'verticalCenter':
				self._removeUpdater('y')
				var update_v_center = this._updateVCenter.bind(this)
				update_v_center()
				self.onChanged('height', update_v_center)
				anchors.onChanged('topMargin', update_v_center)
				anchors.onChanged('bottomMargin', update_v_center)
				self.connectOn(anchors.verticalCenter.parent, 'boxChanged', update_v_center)
				break

			case 'fill':
				anchors.left = anchors.fill.left
				anchors.right = anchors.fill.right
				anchors.top = anchors.fill.top
				anchors.bottom = anchors.fill.bottom
				break

			case 'centerIn':
				anchors.horizontalCenter = anchors.centerIn.horizontalCenter
				anchors.verticalCenter = anchors.centerIn.verticalCenter
				break

			case 'leftMargin':
			case 'rightMargin':
			case 'topMargin':
			case 'bottomMargin':
			case 'margins':
				this.marginsUpdated();
		}
		_globals.core.Object.prototype._update.apply(this, arguments)
	}

}
