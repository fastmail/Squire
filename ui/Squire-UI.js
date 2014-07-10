if (typeof buildPath == "undefined") {
  buildPath = 'build/';
}

function buildPathConCat(value) {
  return buildPath + value;
}
$(document).ready(function() {
  Squire.prototype.testPresenceinSelection = function(name, action, format,
    validation) {
    var path = this.getPath(),
      test = (validation.test(path) | this.hasFormat(format));
    if (name == action && test) {
      return true;
    } else {
      return false;
    }
  };
  SquireUI = function(options) {
    // Create instance of iFrame
    var container, editor;
    if (options.replace) {
      container = $(options.replace).parent();
      $(options.replace).remove();
    } else if (options.div) {
      container = $(options.div);
    } else {
      throw new Error(
        "No element was defined for the editor to inject to.");
    }
    var iframe = document.createElement('iframe');
    var div = document.createElement('div');
    div.className = 'Squire-UI';
    iframe.height = options.height;


    $(div).load(buildPath + 'Squire-UI.html', function() {
      this.linkDrop = new Drop({
        target: $('#makeLink').first()[0],
        content: $('#drop-link').html(),
        position: 'bottom center',
        openOn: 'click'
      });

      this.linkDrop.on('open', function () {
        $('.quit').click(function () {
          $(this).parent().parent().removeClass('drop-open');
        });

        $('.submitLink').click(function () {
          editor = iframe.contentWindow.editor;
          editor.makeLink($(this).parent().children('#url').first().val());
          $(this).parent().parent().removeClass('drop-open');
          $(this).parent().children('#url').attr('value', '');
        });
      });

      this.imageDrop = new Drop({
        target: $('#insertImage').first()[0],
        content: $('#drop-image').html(),
        position: 'bottom center',
        openOn: 'click'
      });

      this.imageDrop.on('open', function () {
        $('.quit').unbind().click(function () {
          $(this).parent().parent().removeClass('drop-open');
        });

        $('.sumbitImageURL').unbind().click(function () {
          console.log("Passed through .sumbitImageURL");
          editor = iframe.contentWindow.editor;
          url = $(this).parent().children('#imageUrl').first()[0];
          editor.insertImage(url.value);
          $(this).parent().parent().removeClass('drop-open');
          $(this).parent().children('#imageUrl').attr('value', '');
        });
      });

      $('.item').click(function() {
        var iframe = $(this).parents('.Squire-UI').next('iframe').first()[0];
        var editor = iframe.contentWindow.editor;
        var action = $(this).data('action');
        
        if (editor.getSelectedText() === '' && action != 'insertImage') return 0;

        test = {
          value: $(this).data('action'),
          testBold: editor.testPresenceinSelection('bold',
            action, 'B', (/>B\b/)),
          testItalic: editor.testPresenceinSelection('italic',
            action, 'I', (/>I\b/)),
          testUnderline: editor.testPresenceinSelection(
            'underline', action, 'U', (/>U\b/)),
          testOrderedList: editor.testPresenceinSelection(
            'makeOrderedList', action, 'OL', (/>OL\b/)),
          testLink: editor.testPresenceinSelection('makeLink',
            action, 'A', (/>A\b/)),
          testQuote: editor.testPresenceinSelection(
            'increaseQuoteLevel', action, 'blockquote', (
              />blockquote\b/)),
          isNotValue: function (a) {return (a == action && this.value !== ''); }
        };

        
        
        if (test.testBold | test.testItalic | test.testUnderline | test.testOrderedList | test.testLink | test.testQuote) {
          if (test.testBold) editor.removeBold();
          if (test.testItalic) editor.removeItalic();
          if (test.testUnderline) editor.removeUnderline();
          if (test.testLink) editor.removeLink();
          if (test.testOrderedList) editor.removeList();
          if (test.testQuote) editor.decreaseQuoteLevel();
        } else if (test.isNotValue('makeLink') | test.isNotValue('insertImage') | test.isNotValue('selectFont')) {
          // do nothing these are dropdowns.
        } else {
          console.log($(this).data('action'));
          editor[$(this).data('action')]();
        }
      });
    });
    $(container).append(div);
    $(container).append(iframe);
    iframe.contentWindow.editor = new Squire(iframe.contentWindow.document);
    iframe.addEventListener('load', function() {
      iframe.contentWindow.editor = new Squire(iframe.contentWindow.document);
    });
    
    return iframe.contentWindow.editor;
  };
});