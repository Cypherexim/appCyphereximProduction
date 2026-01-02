import { Component, OnInit, Input, AfterViewInit, OnDestroy } from '@angular/core';
import {Chart} from 'chart.js';
import { interval, Subscription, timer } from 'rxjs';
import { EventemittersService } from 'src/app/services/eventemitters.service';

@Component({
  selector: 'app-table-card-chart',
  templateUrl: './table-card-chart.component.html',
  styleUrls: ['./table-card-chart.component.css']
})
export class TableCardChartComponent implements OnInit, AfterViewInit, OnDestroy {
  lineChart:Chart;
  @Input() data = {};
  @Input() chartId:string = "";
  
  chartOption:any = {
    id: 0,
    data: [],
    borderColor: '#48b1f0',
    backColor: "#cbeefc"
  };

  chartLabels:string[] = []; 
  intervalSubscription:Subscription = new Subscription()

  eventSubscription:Subscription = new Subscription();
  timerSubscription:Subscription = new Subscription();

  constructor(
    private eventService: EventemittersService
  ) { }

  ngOnDestroy(): void {
    this.intervalSubscription?.unsubscribe();
    this.eventSubscription?.unsubscribe();
    this.timerSubscription?.unsubscribe();
  }

  ngOnInit(): void {this.onChangeYear();}

  ngAfterViewInit(): void {
    this.chartOption.id = this.chartId;
    this.chartOption.data = this.getCommodityDataInArray(JSON.parse(JSON.stringify(this.data)));

    this.setGraphDetails(this.chartId);
  }

  onChangeYear() {
    this.eventSubscription = this.eventService.onChangeDirectionBullet.subscribe({
      next: (res:any) => {
        this.timerSubscription = timer(1500).subscribe(() => {          
          this.chartOption.id = this.chartId;
          this.chartOption.data = this.getCommodityDataInArray(JSON.parse(JSON.stringify(this.data)));
          this.lineChart.data.labels = this.chartLabels;
          this.lineChart.data.datasets[0].data = this.chartOption.data;
          this.lineChart.update();
        });
      },error: (err:any) => console.log(err)
    });
  }

  getCommodityDataInArray(data:any={}):number[] {
    const keys = Object.keys(data);
    
    if(Object.keys(data).length>2) {
      const eliminatedKey = keys.sort().pop();
      delete data[eliminatedKey];
    }

    this.chartLabels = Object.keys(data[keys[1]]);

    return Object.values(data[keys[1]]);
  }

  setGraphDetails(id:string) {
    const lineCanvasEle: any = document.getElementById('chart_line_'+id);
    this.lineChart = new Chart(lineCanvasEle.getContext('2d'), {
      type: 'line',
      data: {
        labels: this.chartLabels,
        datasets: [
          {
            data: this.chartOption.data,
            borderColor: this.chartOption.borderColor,
            pointBackgroundColor: this.chartOption.borderColor,
            backgroundColor: this.chartOption.backColor,
            fill: true,
          }
        ],
      },
      options: {
        animation: false,
        plugins: {legend: {display: false}},
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                grid: {display: false},
                border: {display: false},
                ticks: {display: false}
            },
            x: {
              beginAtZero: true,
              grid: {display: false},
              border: {display: false},
              ticks: {display: false},
            },
          },
        maintainAspectRatio: false
      }
    });
  
    this.intervalSubscription = interval(3000).subscribe(() => this.chartUpdate2());
  }

  chartUpdate2() {
    this.lineChart.data.labels.push(this.lineChart.data.labels.shift());
    this.lineChart.data.datasets[0].data.push(this.lineChart.data.datasets[0].data.shift());
    this.lineChart.update();
  }
}
