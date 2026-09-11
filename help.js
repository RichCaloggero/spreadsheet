    export function generateHelpText (keyboardCommands) {
return `
<h3 id="introduction">Introduction</h3>
<p>I&#x2019;ve often wondered how spreadsheets worked, so I decided to work
with Claude AI to build one. One of my key motovations was to have a way
to experiment on a reasonably complex interaction model with various
approaches to screen reader accessibility.</p>
<p>For now, this demo has no mouse interaction, everything is keyboard
driven. It also does not make any effort to be compatible with excel, or
indeed any other spreadsheet product.</p>
<h3 id="limitations">Limitations</h3>
<p>This works best in Firefox with the NVDA screen reader.</p>
<p>Because of the way Firefox handles file interactions, saving does not
let you choose a filename. The file "spreadsheet.dat" is saved to your
downloads folder. Of course, you are free to rename and/or move it. If
you save without removing &#x201C;spreadsheet.dat&#x201D;, it creates another one with
higher version number like &#x201C;spreadsheet(1).dat&#x201D;. This can get messy&#x2026;</p>
<p>Uploading is fairly standard in that it does allow you to choose a
file from any folder via the standard system dialog.</p>
<p>The grid is limited to 26 columns, 100 rows, i.e.&#xA0;a1 through
z100.</p>
<p>There will be bugs, and error reporting may be spotty or
nonexistant.</p>
<h3 id="keyboard-commands">Keyboard commands</h3>
<p>They are listed in tables at the end of this text. Quick
overview:</p>
<ul>
<li>arrows move around by cell,</li>
<li>home and end move to beginning or end of a row</li>
<li>shift home or end move to start or end of a column</li>
<li>control home or end move to first and last cell in the entire
grid</li>
</ul>
<h3 id="defining-row-and-column-headers">Defining row and column
headers</h3>
<p>You can define a given row or column as a header row or column. For
instance, if your expenses spreadsheet had month names on row 1, and
expense categories down the first column, you could do the
following:</p>
<ol type="1">
<li>move to the first grid cell via control+home</li>
<li>press control+alt+shift+c; now the row contains column headers</li>
<li>press control+alt+shift+r; now the first column contains row
headers</li>
</ol>
<p>Now when you move among the sells, you will hear category names as
you move vertically, or month names as you move horrizontally. If the
cells in the first row or first column have now text in them, these
announcements are not made, but they will still be announced as row
headers or column headers if you actually navigate to them.</p>
<h3 id="defining-ranges">Defining ranges</h3>
<p>TO define a range, place a marker at one end of the range, then as
you move, the range automatically extends in that direction. Moving
among cells within a range announces that fact, as well as adjusting the
selection. Escape clears the range. Starting a new range somewhere else
also clears any other ranges that might exist; only one range may exist
at any one time.</p>
<ol type="1">
<li>Move to any cell and press control+space to set a mark</li>
<li>Move to any other cell in either the same row, or same column as the
mark; stop when the range is correct.</li>
</ol>
<p>You&#x2019;ve now created a range of type row if all cells lie in the same
row, or of type column if they lie in the same column. Rectangular
ranges are not allowed. If you create a row range, then move to the next
row, the range is automatically cleared, and the fact is announced.</p>
<h3 id="autofilling">Autofilling</h3>
<p>To make repetative tasks more manageable, we have implemented
autofilling. Autofills work on ranges, and make it easy to fill cells
within the range with either constant values, or formulas whose
references change with range cell coordinates (see below).</p>
<h4 id="constant-fill">Constant Fill</h4>
<ol type="1">
<li>Define a range</li>
<li>Move to any cell in the range and enter a number in that cell.</li>
</ol>
<p>That number now propagates to all cells in the range.</p>
<h4 id="fill-a-range-with-a-formula">Fill a range with a formula</h4>
<p>Imagine you have a sheet with integers running down the left hand
column. You now want to fill the second column with the square roots of
each of these integers. Rather than having to enter a formula in each
cell in column "b", do the following:</p>
<ol type="1">
<li>Assume integers in column &#x201C;a&#x201D; in rows 2 through 10</li>
<li>Move to column &#x201C;b&#x201D; and select a column range from b2 through
b10</li>
<li>Move to any cell in that range and enter the formula
&#x201C;=sqrt(ref(_row, 1))&#x201D;</li>
</ol>
<p>The range now gets filled with formulas referencing all the cells in
column &#x201C;a&#x201D; which are in the same row range as the range you&#x2019;ve selected.
The ref() function generates cell references from row and column
indecies. These are 1-based as in excel and there are variables which
reference the current row or column:</p>
<ul>
<li>_row or _r references the currently filling row</li>
<li>_column or _c references the currently filling column</li>
</ul>
<p>Thus ref(_r, 1) would reference all the cells in the defined row
range, where column is 1, i.e.&#xA0;a1, a2, a3, etc.</p>
<p>Note that ref is row first, but labels are column first. For
instance: a22 is the same as ref(22, 1).</p>
<h3 id="more-about-formulas">More about formulas</h3>
<ul>
<li>press f2 to begin editing a cell (see keyboard help below)</li>
<li>begin formulas with an equals sign &#x201C;=&#x201D;</li>
<li>common operators: &#x201C;+&#x201D;, &#x201C;-&#x201D;, &#x201C;*&#x201C;,&#x201D;/&#x201D;</li>
<li>exponentiation via uparrow: &#x201C;2^2&#x201D; = 2 squared = 4</li>
<li>comparisons: &#x201C;&lt;&#x201D;, &#x201C;&gt;&#x201D;, &#x201C;==&#x201D;, &#x201C;&lt;=&#x201D;, &#x201C;&gt;=&#x201D;</li>
<li>references like &#x201C;a1&#x201D;, &#x201C;b3&#x201D;, &#x201C;c4&#x201D;, etc become the value of that cell,
or zero if the cell doesn&#x2019;t exist</li>
</ul>

<h3>Keyboard Commands</h3>
${keyboardCommands}
`;
} // generateHelpText

