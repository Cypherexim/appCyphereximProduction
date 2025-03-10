import { Component, OnInit, Input } from '@angular/core';
import { PlanModel } from 'src/app/models/plan';


@Component({
  selector: 'app-plan-template',
  templateUrl: './plan-template.component.html',
  styleUrls: ['./plan-template.component.css']
})
export class PlanTemplateComponent implements OnInit {

  @Input() planData:PlanModel;

  constructor() { }

  ngOnInit(): void {
    
  }

  onSelectPlan() {

  }
}
