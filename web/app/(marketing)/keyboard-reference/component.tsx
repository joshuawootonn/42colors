import { H1, H2 } from '@/components/dialog-headings';

export function KeyboardReference() {
	return (
		<>
			<H1 className="mb-4">keyboard reference</H1>
			<p className="mb-10">shortcuts for tools, colors, canvas, and editing</p>
			<hr className="mx-0 w-full border-t-2 border-black dark:border-white" />

			<H2>editing</H2>
			<ul>
				<li>
					<kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>z</kbd> — undo
				</li>
				<li>
					<kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>z</kbd> — redo
				</li>
			</ul>

			<H2>tools</H2>
			<ul>
				<li>
					<kbd>b</kbd> — select brush
				</li>
				<li>
					<kbd>e</kbd> — select eraser
				</li>
				<li>
					<kbd>c</kbd> — select claimer
				</li>
			</ul>

			<H2>colors</H2>
			<ul>
				<li>
					<kbd>[</kbd> / <kbd>]</kbd> — previous / next foreground color
				</li>
				<li>
					<kbd>x</kbd> — swap foreground and background colors
				</li>
				<li>
					<kbd>9</kbd> / <kbd>0</kbd> — cycle foreground colors (previous / next)
				</li>
				<li>
					<kbd>Alt</kbd> + scroll — cycle colors at cursor (foreground by default)
					<ul>
						<li>
							add <kbd>Shift</kbd> to cycle the background color instead
						</li>
					</ul>
				</li>
			</ul>

			<H2>brush & eraser size</H2>
			<ul>
				<li>
					<kbd>+</kbd> / <kbd>=</kbd> — increase size (active tool)
				</li>
				<li>
					<kbd>-</kbd> / <kbd>_</kbd> — decrease size (active tool)
				</li>
			</ul>

			<H2>navigation</H2>
			<ul>
				<li>
					<kbd>Space</kbd> + drag — pan the canvas
				</li>
				<li>
					Scroll — pan vertically
				</li>
				<li>
					<kbd>Shift</kbd> + scroll — pan horizontally
				</li>
				<li>
					<kbd>⌘</kbd>/<kbd>Meta</kbd> + scroll — zoom at cursor
				</li>
			</ul>
		</>
	);
}