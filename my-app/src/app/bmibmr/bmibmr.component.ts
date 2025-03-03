import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bmibmr',
  imports: [FormsModule],
  templateUrl: './bmibmr.component.html',
  styleUrl: './bmibmr.component.css',
})
export class BmibmrComponent {
  height: string = '';
  weight: string = '';
  age: string = '';

  onHeightChange(): void {
    const heightValue = parseFloat(this.height);
    if (heightValue < 0 || isNaN(heightValue)) {
      this.height = '0';
    }
  }

  onWeightChange(): void {
    const weightValue = parseFloat(this.weight);
    if (weightValue < 0 || isNaN(weightValue)) {
      this.weight = '0';
    }
  }

  onAgeChange(): void {
    const ageValue = parseFloat(this.age);
    if (ageValue < 0 || isNaN(ageValue)) {
      this.age = '0';
    }
  }
}
