import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bmibmr',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bmibmr.component.html',
  styleUrl: './bmibmr.component.css',
})
export class BmibmrComponent {
  height: string = '';
  weight: string = '';
  age: string = '';
  gender: string = '';
  bmiResult: number = 0;
  bmrResult: number = 0;
  bmiCategory: string = '';
  errorMessages: string[] = [];
  showResults: boolean = false;
  showBMRResult: boolean = false;

  onHeightChange(): void {
    const heightValue = parseFloat(this.height);
    this.errorMessages = this.errorMessages.filter(
      (msg) => !msg.includes('Chiều cao')
    );

    if (heightValue < 0 || isNaN(heightValue)) {
      this.height = '0';
    } else if (heightValue > 250) {
      this.height = '250';
      this.errorMessages.push('* Chiều cao không được vượt quá 250cm');
    }
    this.showResults = false;
  }

  onWeightChange(): void {
    const weightValue = parseFloat(this.weight);
    this.errorMessages = this.errorMessages.filter(
      (msg) => !msg.includes('Cân nặng')
    );

    if (weightValue < 0 || isNaN(weightValue)) {
      this.weight = '0';
    } else if (weightValue > 250) {
      this.weight = '250';
      this.errorMessages.push('* Cân nặng không được vượt quá 250kg');
    }
    this.showResults = false;
  }

  onAgeChange(): void {
    const ageValue = parseFloat(this.age);
    if (ageValue < 0 || isNaN(ageValue)) {
      this.age = '0';
    }
    this.errorMessages = this.errorMessages.filter(
      (msg) => !msg.includes('Số tuổi')
    );
    this.showResults = false;
  }

  onGenderChange(): void {
    this.errorMessages = this.errorMessages.filter(
      (msg) => msg !== '* Giới tính không được trống'
    );
    this.showResults = false;
  }

  calculateBMI(): void {
    this.validateFields();
    if (this.errorMessages.length > 0) return;

    const heightM = parseFloat(this.height) / 100;
    const weightKg = parseFloat(this.weight);
    this.bmiResult = weightKg / (heightM * heightM);
    this.bmiCategory = this.getBMICategory(this.bmiResult);
    this.showResults = true;
    this.showBMRResult = false;
  }

  calculateBMR(): void {
    this.validateFields();
    if (this.errorMessages.length > 0) return;

    const weight = parseFloat(this.weight);
    const height = parseFloat(this.height);
    const age = parseInt(this.age);

    // Công thức tính BMR: BMR = (10 × cân nặng) + (6.25 × chiều cao) - (5 × tuổi) + 5 (nam) hoặc -161 (nữ)
    if (this.gender === 'male') {
      this.bmrResult = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      this.bmrResult = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    this.showBMRResult = true;
    this.showResults = false;
  }

  resetForm(): void {
    this.height = '';
    this.weight = '';
    this.age = '';
    this.gender = '';
    this.errorMessages = [];
    this.showResults = false;
    this.showBMRResult = false;
    this.bmiResult = 0;
    this.bmrResult = 0;
    this.bmiCategory = '';
  }

  private getBMICategory(bmi: number): string {
    if (bmi < 16) return 'Gầy độ III';
    if (bmi < 17) return 'Gầy độ II';
    if (bmi < 18.5) return 'Gầy độ I';
    if (bmi < 25) return 'Bình thường';
    if (bmi < 30) return 'Thừa cân';
    if (bmi < 35) return 'Béo phì độ I';
    if (bmi < 40) return 'Béo phì độ II';
    return 'Béo phì độ III';
  }

  private validateFields(): void {
    this.errorMessages = [];
    if (!this.height) {
      this.errorMessages.push('* Chiều cao không được trống');
    } else {
      const heightValue = parseFloat(this.height);
      if (heightValue > 250) {
        this.errorMessages.push('* Chiều cao không được vượt quá 250cm');
      }
    }
    if (!this.weight) {
      this.errorMessages.push('* Cân nặng không được trống');
    } else {
      const weightValue = parseFloat(this.weight);
      if (weightValue > 250) {
        this.errorMessages.push('* Cân nặng không được vượt quá 250kg');
      }
    }
    if (!this.age) {
      this.errorMessages.push('* Số tuổi không được trống');
    }
    if (!this.gender) {
      this.errorMessages.push('* Giới tính không được trống');
    }
  }
}
