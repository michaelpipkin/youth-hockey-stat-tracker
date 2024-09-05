import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-add-evaluation',
  standalone: true,
  imports: [],
  templateUrl: './add-evaluation.component.html',
  styleUrl: './add-evaluation.component.scss',
})
export class AddEvaluationComponent {
  data = signal(['']);

  trackByIndex(index: number, item: any) {
    return index;
  }

  onKeyDown(event: KeyboardEvent, rowIndex: number) {
    if (event.key === 'Enter') {
      event.preventDefault();

      if (rowIndex === this.data().length - 1) {
        this.data.update((data) => [...data, '']);
      }

      this.focusCell(rowIndex + 1);
    }
  }

  onCellInput(event: Event, rowIndex: number) {
    const cellElement = event.target as HTMLTableCellElement;
    let newCellValue = cellElement.innerText;

    // Remove any non-numeric characters
    newCellValue = newCellValue.replace(/[^0-9]/g, '');

    // Update the data signal
    this.data.update((data) => {
      const newData = [...data];
      newData[rowIndex] = newCellValue;
      return newData;
    });

    // Update the cell's content to reflect the validated value
    cellElement.innerText = newCellValue;
  }

  focusCell(rowIndex: number) {
    setTimeout(() => {
      const tableElement = document.querySelector('table') as HTMLTableElement;
      const cell = tableElement.rows[rowIndex].cells[0];
      cell.focus();

      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(cell);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    });
  }
}
