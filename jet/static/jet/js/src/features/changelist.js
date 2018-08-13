var $ = require('jquery');

var ChangeList = function($changelist) {
    this.$changelist = $changelist;
};

ChangeList.prototype = {
    updateFixedHeaderVisibility: function($fixedTable, $originalHeader) {
        var show = $(window).scrollTop() > $originalHeader.offset().top - 5;
        $fixedTable.closest('.helper').toggle(show);
    },
    updateFixedHeaderWidth: function($fixedHeader, $originalHeader) {
        var $originalColumns = $originalHeader.find('th');
        var $columns = $fixedHeader.find('th');

        $originalColumns.each(function(i) {
            $columns.eq(i).css('width', $(this).width());
        });
    },
    initFixedHeader: function($changelist) {
        var $originalHeader = $changelist.find('#result_list thead');
        var $originalToolbar = $changelist.find('#toolbar');
        var $originalObjectTools = $('.object-tools');

        if ($originalHeader.length === 0) {
            return;
        }

        var $fixedHeader = $originalHeader.clone();
        var $fixedToolbar = $originalToolbar.clone(true);
        var $fixedObjectTools = $originalObjectTools.clone(true);
        var $fixedTable = $('<div>')
            .addClass('helper')
            .append($fixedObjectTools)
            .append($fixedToolbar)
            .append('<div class="clear">')
            .append($('<table>').append($fixedHeader));

        $fixedTable.find('.action-checkbox-column').empty();
        $fixedTable.appendTo(document.body);

        $(window).on('scroll', $.proxy(this.updateFixedHeaderVisibility, this, $fixedTable, $originalToolbar));
        $(window).on('resize', $.proxy(this.updateFixedHeaderWidth, this, $fixedHeader, $originalHeader));

        this.updateFixedHeaderWidth($fixedHeader, $originalHeader);
    },
    updateFixedFooter: function($results, $footer) {
        if ($(window).scrollTop() + $(window).height() < $results.offset().top + $results.outerHeight(false) + $footer.innerHeight()) {
            if (!$footer.hasClass('fixed')) {
                var previousScrollTop = $(window).scrollTop();

                $footer.addClass('fixed');
                $results.css('margin-bottom', ($footer.innerHeight()) + 'px');

                $(window).scrollTop(previousScrollTop);
            }
        } else {
            if ($footer.hasClass('fixed')) {
                $footer.removeClass('fixed');
                $results.css('margin-bottom', 0);
            }
        }
    },
    initFixedFooter: function($changelist) {
        var $footer = $changelist.find('.changelist-footer');
        var $results = $footer.siblings('.results');

        if ($footer.length == 0 || $results.length == 0) {
            return;
        }

        $(window).on('scroll', $.proxy(this.updateFixedFooter, this, $results, $footer));
        $(window).on('resize', $.proxy(this.updateFixedFooter, this, $results, $footer));

        this.updateFixedFooter($results, $footer);
    },
    initHeaderSortableSelection: function() {
        $('table thead .sortable').on('click', function(e) {

            if (e.target != this) {
                return;
            }

            var link = $(this).find('.text a').get(0);

            if (link != undefined) {
                link.click();
            }
        });
    },
    initRowSelection: function($changelist) {
        $changelist.find('#result_list tbody th, #result_list tbody td').on('click', function(e) {
            // Fix selection on clicking elements inside row (e.x. links)
            if (e.target != this) {
                return;
            }

            $(this).closest('tr').find('.action-checkbox .action-select').click();
        });
    },
    getColumnName: function (className, prefix) {
        if (typeof prefix === 'undefined') {
            prefix = 'column-';
        }
        var classes = className.split(/\s+/);
        var columnName = '';
        classes.forEach(function (className) {
            if (className.indexOf(prefix) === 0) {
                columnName = className.slice(prefix.length);
            }
        });
        return columnName;
    },
    changeHiddenColumns: function (hiddenColumn) {
        var hiddenColumns = JSON.parse(localStorage.getItem('hiddenColumns') || '[]');
        if (hiddenColumns.indexOf(hiddenColumn) !== -1) {
            hiddenColumns.splice(hiddenColumns.indexOf(hiddenColumn), 1);
        }
        else {
            hiddenColumns.push(hiddenColumn);
        }
        localStorage.setItem('hiddenColumns', JSON.stringify(hiddenColumns));
        this.updateColumns();
    },
    updateColumns: function () {
        var self = this;
        var $resultList = this.$changelist.find('#result_list');
        var hiddenColumns = JSON.parse(localStorage.getItem('hiddenColumns') || '[]');
        $resultList.find('thead th:not(.action-checkbox-column)').each(function () {
            var columnName = self.getColumnName($(this).attr('class'));
            $(this).toggle(hiddenColumns.indexOf(columnName) === -1);
        });
        $resultList.find('tbody th:not(.action-checkbox), tbody td:not(.action-checkbox)').each(function () {
            var columnName = self.getColumnName($(this).attr('class'), 'field-');
            $(this).toggle(hiddenColumns.indexOf(columnName) === -1);
        });
        $('table.helper th:not(.action-checkbox-column)').each(function () {
            var columnName = self.getColumnName($(this).attr('class'));
            $(this).toggle(hiddenColumns.indexOf(columnName) === -1);
        });
        $(window).trigger('resize');
    },
    initColumnSelect: function ($changelist) {
        var self = this;
        var $button = $('<li><a class="button icon-settings" href="#"></a></li>');
        $button.click(function () {
            var $container = $('<div title="Управление столбцами"></div>');
            $changelist.find('#result_list thead th:not(.action-checkbox-column)').each(function () {
                var columnName = self.getColumnName($(this).attr('class'));
                var id = 'changelist-column-checkbox-' + columnName;
                var hiddenColumns = localStorage.getItem('hiddenColumns') || [];
                var checked = '';
                if (hiddenColumns.indexOf(columnName) === -1) {
                    checked = 'checked';
                }
                $checkbox = $(
                    '<div>' +
                    '   <input type="checkbox" id="' + id + '" ' + checked + ' />' +
                    '   <label for="' + id + '">' + $(this).text() + '</label>' +
                    '</div>');
                $checkbox.find('input').change($.proxy(self.changeHiddenColumns, self, columnName));
                $container.append($checkbox);
            });
            var dialog = $container.dialog({
                modal: true,
                resizable: false,
                close: function( event, ui ) {
                    $container.dialog( "destroy" );
                }
            });
        });
        $('.object-tools').append($button);
    },
    run: function () {
        var $changelist = this.$changelist;

        try {
            this.initFixedHeader($changelist);
            this.initFixedFooter($changelist);
            this.initHeaderSortableSelection($changelist);
            this.initRowSelection($changelist);
            this.initColumnSelect($changelist);
            this.updateColumns();
        } catch (e) {
            console.error(e, e.stack);
        }

        this.$changelist.addClass('initialized');
    }
};

$(document).ready(function() {
    $('#changelist').each(function() {
        new ChangeList($(this)).run();
    });
});
