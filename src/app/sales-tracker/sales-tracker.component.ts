import { Component, signal, computed } from '@angular/core';
// This interface defines the structure of the daily sales data that will be stored in localStorage.
interface DailySalesData {
  chats: number;
  saleAmounts: number[];
}

const DAILY_SALES_STORAGE_KEY = 'dailySalesTracker';
// This function loads the daily sales data from localStorage. If no data is found, it returns default values.
function loadDailySalesData(): DailySalesData {
  const saved = localStorage.getItem(DAILY_SALES_STORAGE_KEY);
// If no saved data is found, return default values for chats and saleAmounts.
  if (saved === null) {
    return { chats: 0, saleAmounts: [] };
  }

  const parsed: unknown = JSON.parse(saved);

  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    'chats' in parsed &&
    typeof parsed.chats === 'number' &&
    Number.isFinite(parsed.chats) &&
    parsed.chats >= 0 &&
    'saleAmounts' in parsed &&
    Array.isArray(parsed.saleAmounts) &&
    parsed.saleAmounts.every(
      (amount: unknown) =>
        typeof amount === 'number' && Number.isFinite(amount) && amount >= 0
    )
  ) {
    return { chats: parsed.chats, saleAmounts: parsed.saleAmounts };
  }

  throw new Error('Saved dashboard data is not in the expected format.');
}
// This function saves the daily sales data to localStorage.
function saveDailySalesData(data: DailySalesData): void {
  localStorage.setItem(DAILY_SALES_STORAGE_KEY, JSON.stringify(data));
}
// The SalesTrackerComponent is a standalone Angular component that tracks daily sales data, including the number of chats, sale amounts, and various computed metrics such as total revenue, revenue per chat, conversion rate, and average order value.
@Component({
  standalone: true,
  imports: [],
  selector: 'app-sales-tracker',
  templateUrl: './sales-tracker.component.html',
  styleUrl: './sales-tracker.component.css',
})
// The SalesTrackerComponent class manages the state and behavior of the sales tracker dashboard.
export class SalesTrackerComponent {

  // signals for where the user inputs will be stored
private readonly savedData = loadDailySalesData();
protected readonly chats = signal(this.savedData.chats);
protected readonly saleAmounts = signal<number[]>(this.savedData.saleAmounts);
protected readonly salesMade = computed(() => this.saleAmounts().length);
protected readonly totalRevenue = computed(() =>
  this.saleAmounts().reduce((total, amount) => total + amount, 0)
);
protected readonly amountSold = signal(0);

// Formulas — update automatically whenever inputs change
protected readonly revenuePerChat = computed(() =>
  this.chats() > 0 ? this.totalRevenue() / this.chats() : 0
);

protected readonly conversionRate = computed(() =>
  this.chats() > 0 ? (this.salesMade() / this.chats()) * 100 : 0
);

protected readonly avgOrderValue = computed(() =>
  this.salesMade() > 0 ? this.totalRevenue() / this.salesMade() : 0

);
// Computed signal that automatically grabs the last item in the saleAmounts array
protected readonly lastOrderAmount = computed(() => {
  const amounts = this.saleAmounts();
  return amounts.length > 0 ? amounts[amounts.length - 1] : null;
});

  getDate(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  protected updateChats(event: Event): void {
    const input = event.target as HTMLInputElement;
    const chats = Math.max(0, Math.floor(Number(input.value) || 0));
    saveDailySalesData({ chats, saleAmounts: this.saleAmounts() });
    this.chats.set(chats);
  }

  protected updateSaleAmount(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.amountSold.set(Math.max(0, Number(input.value) || 0));
  }

  protected addSale(): void {
    const amount = this.amountSold();

    if (amount <= 0) {
      return;
    }

    const saleAmounts = [...this.saleAmounts(), amount];
    saveDailySalesData({ chats: this.chats(), saleAmounts });
    this.saleAmounts.set(saleAmounts);
    this.amountSold.set(0);
  }

  protected resetDashboard(): void {
    if (!window.confirm('Reset today’s chats and recorded sales?')) {
      return;
    }

    localStorage.removeItem(DAILY_SALES_STORAGE_KEY);
    this.chats.set(0);
    this.saleAmounts.set([]);
    this.amountSold.set(0);
  }
}