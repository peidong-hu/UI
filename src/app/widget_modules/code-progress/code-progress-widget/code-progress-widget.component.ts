import {ChangeDetectorRef, Component, ComponentFactoryResolver, OnInit, ViewChild} from '@angular/core';
import {IClickListData, IClickListItemDeploy} from 'src/app/shared/charts/click-list/click-list-interfaces';
import {CodeProgressService} from 'src/app/widget_modules/code-progress/code-progress.service';
import {of, Subscription} from 'rxjs';
import {CODEPROGRESS_CHARTS} from 'src/app/widget_modules/code-progress/code-progress-widget/code-progress-charts';
import {ICodeProgress} from 'src/app/widget_modules/code-progress/interfaces';
import {DashStatus} from 'src/app/shared/dash-status/DashStatus';
import {DashboardService} from 'src/app/shared/dashboard.service';
import {CodeProgressDetailComponent} from 'src/app/widget_modules/code-progress/code-progress-detail/code-progress-detail.component';
import {WidgetComponent} from 'src/app/shared/widget/widget.component';
import {distinctUntilChanged, startWith, switchMap} from 'rxjs/operators';
import {LayoutDirective} from 'src/app/shared/layouts/layout.directive';
import {OneChartLayoutComponent} from 'src/app/shared/layouts/one-chart-layout/one-chart-layout.component';
import {WidgetState} from '../../../shared/widget-header/widget-state';

@Component({
  selector: 'app-code-progress-widget',
  templateUrl: './code-progress-widget.component.html',
  styleUrls: ['./code-progress-widget.component.scss']
})

export class CodeProgressWidgetComponent extends WidgetComponent implements OnInit {
  // tslint:disable-next-line:no-shadowed-variable
  constructor(ComponentFactoryResolver: ComponentFactoryResolver,
              cdr: ChangeDetectorRef,
              dashboardService: DashboardService,
              private deployService: CodeProgressService) {
    super(ComponentFactoryResolver, cdr, dashboardService);
  }
  charts: any;
  widgetId: string;
  layout: typeof OneChartLayoutComponent;
  // private TimeThreshold: number;

  // Default build time threshold
// Reference to the subscription used to refresh the widget
  private intervalRefreshSubscription: Subscription;

  // @ts-ignore
  @ViewChild(LayoutDirective) childLayoutTag: LayoutDirective;

  ngOnInit() {
    this.widgetId = 'code-progress';
    this.layout = OneChartLayoutComponent;
    // Chart configuration moved to external file
    this.charts = CODEPROGRESS_CHARTS;
    this.auditType = 'CODE_PROGRESS';
    this.init();
  }

  // tslint:disable-next-line:use-lifecycle-interface
  ngAfterViewInit() {
    this.startRefreshInterval();
  }

  startRefreshInterval() {
    this.intervalRefreshSubscription = this.dashboardService.dashboardRefresh$.pipe(
      startWith(-1), // Refresh this widget seperate from dashboard (ex. config is updated)
      distinctUntilChanged(), // If dashboard is loaded the first time, ignore widget double refresh
      switchMap(_ => this.getCurrentWidgetConfig()),
      switchMap(widgetConfig => {
        if (!widgetConfig) {
          return of([]);
        }
        this.widgetConfigExists = true;
        this.state = WidgetState.READY;
        // this.TimeThreshold = 1000 * 60 * widgetConfig.options.deployDurationThreshold;
        return this.deployService.fetchDetails(widgetConfig.componentId);
      })).subscribe(result => {
        this.hasData = (result && result.length > 0);
        if (this.hasData) {
          this.loadCharts(result);
        } else {
          this.setDefaultIfNoData();
        }
    });
  }
  // Unsubscribe from the widget refresh observable, which stops widget updating.
  stopRefreshInterval() {
    if (this.intervalRefreshSubscription) {
      this.intervalRefreshSubscription.unsubscribe();
    }
  }

  loadCharts(result: ICodeProgress[]) {
    this.generateLatestDeployData(result);
    super.loadComponent(this.childLayoutTag);
  }

  generateLatestDeployData(resultIn: ICodeProgress[]) {

    let envConfigs = ['DEV', 'QA', 'PROD'];

    let result:ICodeProgress[] = [];

    envConfigs.forEach((ev, ei) => {
    result[ei] = resultIn.filter((elem) => {
      if(elem.name == ev)
      return elem;
    })[0];
  });

    var columns3:any = [];
    columns3.push({name: 'Pipeline Start'});

    var aRow:any = new Array(result.length + 1);

    var rows3:any[][] = [];

    var rowCount = 0;
    result.forEach((value, index) => {
      columns3.push({name : value.name});

      value.units.forEach((unitValue, unitIdx) => {
        var findRow;
        for (let row of rows3) {
          if (row[0] == unitValue.name) findRow = row;
        }

        if (findRow == null) {
          rows3[rowCount] = new Array(result.length + 1);
          rows3[rowCount][0] = unitValue.name;
          rows3[rowCount][index + 1] = unitValue.version;

          rowCount++;
        } else {
          findRow[index + 1] = unitValue.version;
        }
      });

    });

    var rows2:any[][] = [
    ['1.1','1.2','1.3'],
    ['2.1','2.2','2.3'],
    ['3.1','3.2','3.3']
    ];

    var columns2 = [
      { name: 'DEV' },
      { name: 'QA' },
      { name: 'PREPROD' }
    ];
    this.charts[0].data = [{rows: rows3, columns: columns3}]
  }

  setDefaultIfNoData() {
    if (!this.hasData) {
      this.charts[0].data = { items: [{ title: 'No Data Found' }]};
    }
    super.loadComponent(this.childLayoutTag);
  }

}
