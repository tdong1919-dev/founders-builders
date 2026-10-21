/* Warn about unsaved local edits. Never persists or transmits form contents. */
(function(root){
  'use strict';
  root.FBDraftGuard={install:function(hasUnsavedChanges){
    function warn(event){
      if(!hasUnsavedChanges())return;
      event.preventDefault();
      event.returnValue='';
    }
    root.addEventListener('beforeunload',warn);
  }};
})(window);
