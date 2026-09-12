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
downloads folder. Of course, you are free to rename and/or move it. If you save without removing "spreadsheet.dat", it creates another one with higher version number like "spreadsheet(1).dat". This can get messy...

Uploading is fairly standard in that it does allow you to choose a file
from any folder via the standard system dialog.

The grid is limited to 26 columns, 100 rows, i.e. a1 through z100.
 
There will be bugs, and error reporting may be spotty or nonexistant.

### Keyboard commands

They are listed in tables at the end of this text. Quick overview:

- arrows move around by cell,
- home and end move to beginning or end of a row
- shift home or end move to start or end of a column
- control home or end move to first and last cell in the entire grid


### Defining row and column headers

You can define a given row or column as a header row or column. For instance, if your expenses spreadsheet had month names on row 1, and expense categories down the first column, you could do the following:

1. move to the first grid cell via control+home
2. press control+alt+shift+c; now the row contains column headers
3. press control+alt+shift+r; now the first column contains row headers

Now when you move among the sells, you will hear category names as you move vertically, or month names as you move horrizontally. If the cells in the first row or first column have now text in them, these announcements are not made, but they will still be announced as row headers or column headers if you actually navigate to them.

### Defining ranges

TO define a range, place a marker at one end of the range, then as you move, the range automatically extends in that direction. Moving among cells
within a range announces that fact, as well as adjusting the selection.
 Escape clears the range. Starting a new range somewhere else also clears any other ranges that might exist;
only one range may exist at any one time.

1.  Move to any cell and press control+space to set a mark
2.  Move to any other cell in either the same row, or same column as the
    mark; stop when the range is correct. 

You've now created a range of type row if all cells lie in the same
row, or of type column if they lie in the same column. Rectangular
ranges are not allowed.  If you create a row range, then move to the next row, the range is automatically cleared, and the fact is announced.

### Autosum

To sum the values of cells in a range:

1. define a row or column range
2. press alt+=, followed by enter

The alt+= prodeces a edit box with the formula representing the sum of all the cells in the range. Pressing enter commits this and creates a new cell just to the right (for row ranges), or just below (for column ranges), containing the sum. As is always the case when a commmand runs over a range, the range is cleared.

### Undo

Pressing control+z undoes the last operation. This is especially useful on commands that modify ranges. For example, if you want to change what the autosum does, press control+z after running the autosum, and then modify as desired.


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

1.  Assume integers in column "a" in rows 2 through 10
2.  Move to column "b" and select a column range from b2 through b10
3.  Move to any cell in that range and enter the formula "=sqrt(ref(_row, 1))"

The range now gets filled with formulas referencing all the cells in
column "a" which are in the same row range as the range you've
selected. The ref() function generates cell references from row and column indecies. These are 1-based as in excel and there are variables which reference the current row or column:

- _row or _r references the currently filling row
- _column or _c references the currently filling column

Thus ref(_r, 1) would reference all the cells in the defined row range, where column is 1, i.e. a1, a2, a3, etc.

Note that ref is row first, but labels are column first. For instance: a22 is the same as ref(22, 1).

### ref and autosum example

1. move to cell a1 and select a row range of 6 cells (a1 through f1)
2. press f2 and type "=_c", followed by enter
3. press alt+=, followed by enter

You should have the numbers 1 through 6 in cells a1 through f1, and the number 21 in cell f7.

### More about formulas

- press f2 to begin editing a cell (see keyboard help below)
- begin formulas with an equals sign "="
- common operators: "+", "-", "*", "/"
- exponentiation via uparrow: "2^2" = 2 squared = 4
- comparisons: "<", ">", "==", "<=", ">="
- references like "a1", "b3", "c4", etc become the value of that cell, or zero if the cell doesn't exist
 
