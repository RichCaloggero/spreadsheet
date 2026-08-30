### Introduction

I've often wondered how spreadsheets worked, so I decided to work with
Claude AI to build one. One of my key motovations was to have a way to
experiment on a reasonably complex interaction model with various
approaches to screen reader accessibility.

For now, this demo has no mouse interaction, everything is keyboard
driven. It also does not make any effort to be compatible with excel, or
indeed any other spreadsheet product.

### Limitations

This works best in Firefox with the NVDA screen reader.

Because of the way Firefox handles file interactions, saving does not
let you choose a filename. The file \"spreadsheet.dat\" is saved to your
downloads folder. Of course, you are free to rename and/or move it.

Uploading is fairly standard in that it does allow you to choose a file
from any folder via the standard system dialog.

There will be bugs, and error reporting may be spotty or nonexistant.

### Defining ranges

tp\>Unlike other programs, selecting items is done via mark set. You
place a marker at one end of the range, move to the other and press the
shortcut a second time to complete the selection. Moving among cells
within a range announces the fact; escape clears the range. Starting a
new range somewhere else also clears any other ranges that might exist;
only one range may exist at any one time.

1.  Move to any cell and press control+space to set a mark
2.  Move to any other cell in either the same row, or same column as the
    mark and press control+space

You\'ve now created a range of type row if all cells lie in the same
row, or of type column if they lie in the same column. Rectangular
ranges are not allowed.

### Autofilling

To make repetative tasks more manageable, we have implemented
autofilling. Autofills work on ranges, and make it easy to fill cells
within the range with either constant values, or formulas whose
references change with range cell coordinates (see below).

#### Constant Fill

1.  Define a range
2.  Move to any cell in the range and enter a number in that cell.

That number now propagates to all cells in the range.

#### Fill a range with a formula

Imagine you have a sheet with integers running down the left hand
column. You now want to fill the second column with the square roots of
each of these integers. Rather than having to enter a formula in each
cell in column \"b\", do the following:

1.  Assume integers in column \"a\" in rows 2 through 10
2.  Move to column \"b\" and select a column range from b2 through b10
3.  Move to any cell in that range and enter the formula \"=sqrt(a1)\"

The range now gets filled with formulas referencing all the cells in
column \"a\" which are in the same row range as the range you\'ve
selected
