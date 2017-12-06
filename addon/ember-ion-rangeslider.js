import Ember from 'ember';

var get = Ember.get;
var merge = Ember.merge;

var ionProperties = {
  type               : 'single',
  values             : [],
  min                : 10,
  max                : 100,
  step               : 1,
  min_interval       : null,
  max_interval       : null,
  drag_interval      : false,

  from_fixed         : false,
  from_min           : 10,
  from_max           : 100,
  from_shadow        : false,
  to_fixed           : false,
  to_min             : 10,
  to_max             : 100,
  to_shadow          : false,

  prettify_enabled   : true,
  prettify_separator : ' ',
  prettify           : null,

  force_edges        : false,
  keyboard           : false,
  keyboard_step      : 5,

  grid               : false,
  grid_margin        : true,
  grid_num           : 4,
  grid_snap          : false,
  hide_min_max       : false,
  hide_from_to       : false,

  prefix             : '',
  postfix            : '',
  max_postfix        : '',
  decorate_both      : true,
  values_separator   : ' - ',
  disabled           : false
};

export default Ember.Component.extend({
  tagName: 'input',
  classNames: ['ember-ion-rangeslider'],
  type: 'single', //## explicit, waiting for this.attr.type
  _slider: null,

  ionReadOnlyOptions: Ember.computed(function(){
    var ionOptions = {};
    for (var pName in ionProperties){
      ionOptions[pName] = this.getWithDefault(pName, ionProperties[pName]);
    }
    return ionOptions;
  }).readOnly(),

  sliderOptions: Ember.computed(function(){
    //## Update trigger: change|finish
    var updateTrigger = get(this, 'updateTrigger') || 'finish',
        throttleTimeout = get(this, 'throttleTimeout') || 50,
        to = get(this, 'to'),
        from = get(this, 'from'),
        options = {
          to: 10,
          from: 100,
          onChange() {},
          onFinish: Ember.run.bind(this, '_sliderDidFinish'),
        };

    if (from || from === 0) {
      options.from = from
    }
    if (to || to === 0) {
      options.to = to
    }
    //## Setup change update trigger
    if (updateTrigger === 'change') {
      options.onChange = Ember.run.bind(this, '_sliderDidChange', throttleTimeout);
      options.onFinish = function() {};
    }
    merge(options, this.get('ionReadOnlyOptions'));
    return options;
  }).readOnly(),

  //## Setup/destroy
  didInsertElement() {
    var options = get(this, 'sliderOptions');
    this.$().ionRangeSlider(options);
    this._slider = this.$().data('ionRangeSlider');

    options = this.get('ionReadOnlyOptions');
    for (var optName in options){
      Ember.addObserver(this, optName, this, '_readOnlyPropertiesChanged');
    }
  },

  willDestroyElement() {
    this._slider.destroy();
    var options = this.get('ionReadOnlyOptions');
    for (var optName in options){
      Ember.removeObserver(this, optName, this, '_readOnlyPropertiesChanged');
    }
  },

  //## Bound values observers
  _onToFromPropertiesChanged: Ember.observer(
    'to', 'from',
    function(){
      var propName = arguments[1];

      //## slider.update removes the focus from the currently active element.
      //## In case where multiple sliders bound to the same property
      //## don't update the active slider values (to/from) as it results in a
      //## a loss of focus in a currently active slider
      if(this._slider && !this._slider.is_active){
        this._slider.update(this.getProperties(propName));
      }
  }),

  _readOnlyPropertiesChanged: function(){
    this._slider.update(this.getProperties(arguments[1]));
  },

  _sliderDidChange: function(throttleTimeout, changes){
    var args = {'to': changes.to, 'from': changes.from };
    Ember.run.debounce(this, this.setProperties, args, throttleTimeout);
  },

  _sliderDidFinish: function(changes){
    this.setProperties({'to': changes.to, 'from': changes.from});
  }
});
