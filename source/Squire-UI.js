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
    if (typeof options.buildPath == "undefined") {
      options.buildPath = 'build/';
    }
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

    $(div).load(options.buildPath + 'Squire-UI.html', function() {
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
          var editor = iframe.contentWindow.editor;
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
          var editor = iframe.contentWindow.editor;
          url = $(this).parent().children('#imageUrl').first()[0];
          editor.insertImage(url.value);
          $(this).parent().parent().removeClass('drop-open');
          $(this).parent().children('#imageUrl').attr('value', '');
        });

      });

      this.fontDrop = new Drop({
        target: $('#selectFont').first()[0],
        content: $('#drop-font').html(),
        position: 'bottom center',
        openOn: 'click'
      });

      this.fontDrop.on('open', function () {
        $('.quit').click(function () {
          $(this).parent().parent().removeClass('drop-open');
        });

        $('.submitFont').unbind().click(function () {
          var editor = iframe.contentWindow.editor;
          var selectedFonts = $('select#fontSelect option:selected').last().data('fonts');
          var fontSize =  $('select#textSelector option:selected').last().data('size') + 'px';
          editor.setFontSize(fontSize);

          try {
            editor.setFontFace(selectedFonts);
          } catch (e) {
            alert('Please make a selection of text.');
          } finally {
            $(this).parent().parent().removeClass('drop-open');
          }

        });


      });

      $('.item').click(function() {
        var iframe = $(this).parents('.Squire-UI').next('iframe').first()[0];
        var editor = iframe.contentWindow.editor;
        var action = $(this).data('action');

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

        editor.alignRight = function () { editor.setTextAlignment('right'); };
        editor.alignCenter = function () { editor.setTextAlignment('center'); };
        editor.alignLeft = function () { editor.setTextAlignment('left'); };
        editor.alignJustify = function () { editor.setTextAlignment('justify'); };
        editor.makeHeading = function () { editor.setFontSize('2em'); editor.bold(); };

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
            editor[action]();
            editor.focus();
        }
      });
    });

    $(container).append(div);
    $(container).append(iframe);

    var style = document.createElement('style');
    style.innerHTML = 'blockquote { border-left: 3px green solid; padding-left: 5px; }';


    iframe.contentWindow.editor = new Squire(iframe.contentWindow.document);
    iframe.addEventListener('load', function() {
      iframe.contentWindow.editor = new Squire(iframe.contentWindow.document);
    });

    iframe.contentWindow.document.head.appendChild(style);
    return iframe.contentWindow.editor;
  };
});
