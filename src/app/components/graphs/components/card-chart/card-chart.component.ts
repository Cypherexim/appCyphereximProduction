import { Component, OnInit, Input, AfterViewInit, OnDestroy } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { interval, Subscription } from 'rxjs';
import { EventemittersService } from 'src/app/services/eventemitters.service';

@Component({
  selector: 'app-card-chart',
  templateUrl: './card-chart.component.html',
  styleUrls: ['./card-chart.component.css']
})
export class CardChartComponent implements OnInit, AfterViewInit, OnDestroy {
  lineChar:Chart;
  @Input() cardTypeName:string='';
  @Input() currentPercent:string='--';  
  @Input() performPercent:string=''; 
  @Input() chartOption:any = {}; 
  @Input() radioId:any = ''; 
  chartLabels:string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August']; 
  intervalSubscription:Subscription = new Subscription()
  choosenYear:number = 2022;
  yearList:number[] = [2022, 2023]

  constructor(
    private eventService: EventemittersService
  ) { }


  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.intervalSubscription?.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.setGraphDetails(this.chartOption.id);
  }

  onChangeYear() {
    this.eventService.onChangeDirectionBullet.next({type: "year", value: this.choosenYear});
    this.eventService.whatsTrendingEvent.next(this.choosenYear);
  }

  onRadioClick(id:string) {
    const exportTag = document.getElementById('exportBullet') as HTMLSpanElement; 
    const importTag = document.getElementById('importBullet') as HTMLSpanElement;
    const radioType = id.split('Bullet')[0];

    if(radioType == 'export'){
      exportTag.classList.add('active-radio');
      importTag.classList.remove('active-radio');
    } else {
      exportTag.classList.remove('active-radio');
      importTag.classList.add('active-radio');
    }
    this.eventService.onChangeDirectionBullet.next({type: "direction", value: radioType});
  }

  setGraphDetails(id) {
    const lineCanvasEle: any = document.getElementById('line_chart_'+id);
    
    this.lineChar = new Chart(lineCanvasEle.getContext('2d'), {
      type: 'line',
      data: {
        labels: this.chartLabels,
        datasets: [
          { 
            data: this.chartOption.data,//[15, 5, 20, 10, 30, 13, 5, 28], 
            borderColor: this.chartOption.borderColor,//'#48b1f0',
            pointBackgroundColor: this.chartOption.borderColor,//'#48b1f0',
            backgroundColor: this.chartOption.backColor,//'#cbeefc',
            fill: true,
          }
        ],
      },
      options: {
        // animation: false,
        plugins: {legend: {display: false,}},
        responsive: true,
        events: ["mouseover", "mouseout"],
        maintainAspectRatio: false,
        scales: {
          y: {
              // beginAtZero: true,
              grid: {display: false},
              border: {display: false},
              ticks: {display: false}
          },
          x: {
            // beginAtZero: true,
            grid: {display: false},
            border: {display: false},
            ticks: {display: false},
          }
        }
      }
    });

    this.intervalSubscription = interval(2000).subscribe(() => this.chartUpdate());
  }

  onHoverChart() {
    this.intervalSubscription?.unsubscribe();
  }

  chartUpdate() {
    this.lineChar.data.labels.push(this.lineChar.data.labels.shift());
    this.lineChar.data.datasets[0].data.push(this.lineChar.data.datasets[0].data.shift());
    this.lineChar.update();
  }
}
