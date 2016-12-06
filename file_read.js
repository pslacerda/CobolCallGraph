/**
 * This file iplements functinalities to read text from local files.
 *  Usage:
 *  var text = '';
 *  loadLocalFile(function(allText){
 *      text = allText;
 *  });
 *
 */
(function (d) {
  'use strict';
  var $input = {
    input: null,
    get: function () {
      var localReference = this;
      if (this.input === null) {
        this.input = d.createElement("input");
        this.input.style = "display: none";
        this.input.multiple = "true";
        this.input.type = "file";
        this.input.onchange = function () {
          localReference.loadText();
        };
        d.body.appendChild(this.input);
      }
      return this.input;
    },
    click: function () {
      this.get().click();
    },
    loadText: function (callback) {
      var reader = new FileReader();
      var localReference = this;
      var text = "";
      var loadCount = 0;
      var callb = callback || this.callback;
      reader.onload = function () {
        text += reader.result;
        if (++loadCount >= localReference.get().files.length)
          callb.call(this, text);
        else {
          reader.readAsText(localReference.get().files[loadCount]);
        }
      };
      if (localReference.get().files[0].size) {
        reader.readAsText(localReference.get().files[0]);
      }
    }
  };
  var loadText = function (callback) {
    $input.callback = callback;
    $input.click();
  }

  window.loadLocalFile = loadText;
})(document);
