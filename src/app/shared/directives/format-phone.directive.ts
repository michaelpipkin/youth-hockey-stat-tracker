import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appFormatPhone]',
  standalone: true,
})
export class FormatPhoneDirective {
  el = inject(ElementRef);
  control = inject(NgControl);

  @HostListener('blur', ['$event']) onBlur(event: any) {
    let value = event.target.value.replace(/[-]/g, ''); // Strip existing hyphens

    if (value.length === 10) {
      value = `${value.slice(0, 3)}-${value.slice(3, 6)}-${value.slice(6, 10)}`;
    }

    // Update view and model values
    event.target.value = value;
    this.control.control?.setValue(value);

    // Trigger re-validation
    this.control.control?.markAsDirty();
    this.control.control?.updateValueAndValidity();
  }
}
