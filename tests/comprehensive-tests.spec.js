const { test, expect } = require('@playwright/test');

// Test configuration
const config = {
  baseURL: 'http://localhost:3000',
  serverURL: 'http://localhost:5001',
  timeout: 30000,
  testPhones: {
    citizen: '+919876543210',
    officer: '+919876543211',
    admin: '+919876543212'
  }
};

// Test data
const testData = {
  department: {
    name: 'Test Department',
    name_marathi: 'चाचणी विभाग',
    name_hindi: 'परीक्षण विभाग',
    district: 'Pune',
    contact_whatsapp: '+919876543299',
    contact_email: 'test@dept.gov.in'
  },
  officer: {
    name: 'Test Officer',
    role: 'Assistant Engineer',
    whatsapp: '+919876543298',
    email: 'officer@test.gov.in',
    designation: 'AE'
  },
  grievance: {
    summary: 'Test water supply issue',
    description: 'No water supply for 3 days in our area',
    category: 'Water Supply',
    severity: 'high',
    pincode: '411001',
    address: 'Test Area, Pune'
  }
};

// Helper functions
async function loginUser(page, phone, role = 'citizen') {
  await page.goto('/login');

  // Select country code and enter phone number
  await page.click('[data-testid="country-dropdown"]');
  await page.click('[data-value="+91"]');
  await page.fill('[data-testid="phone-input"]', phone.replace('+91', ''));
  await page.click('[data-testid="send-otp-button"]');

  // Wait for OTP input to appear
  await page.waitForSelector('[data-testid="otp-input"]');

  // Enter any OTP (development mode accepts any OTP)
  await page.fill('[data-testid="otp-input"]', '123456');
  await page.click('[data-testid="verify-otp-button"]');

  // Wait for dashboard to load
  await page.waitForURL('**/dashboard');
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
}

async function logout(page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('**/login');
}

async function createTestDepartment(page) {
  await page.goto('/departments');
  await page.click('[data-testid="add-department-button"]');

  await page.fill('[data-testid="dept-name"]', testData.department.name);
  await page.fill('[data-testid="dept-name-marathi"]', testData.department.name_marathi);
  await page.fill('[data-testid="dept-name-hindi"]', testData.department.name_hindi);
  await page.fill('[data-testid="dept-district"]', testData.department.district);
  await page.fill('[data-testid="dept-whatsapp"]', testData.department.contact_whatsapp);
  await page.fill('[data-testid="dept-email"]', testData.department.contact_email);

  await page.click('[data-testid="save-department-button"]');
  await expect(page.locator('.toast-success')).toContainText('Department created successfully');
}

// Test Suite 1: Authentication Tests
test.describe('Authentication System', () => {
  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login');

    // Check page elements
    await expect(page.locator('h1')).toContainText('जनता दरबार');
    await expect(page.locator('[data-testid="phone-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="country-dropdown"]')).toBeVisible();
    await expect(page.locator('[data-testid="send-otp-button"]')).toBeVisible();
  });

  test('should handle phone number validation', async ({ page }) => {
    await page.goto('/login');

    // Test invalid phone number
    await page.fill('[data-testid="phone-input"]', '123');
    await page.click('[data-testid="send-otp-button"]');
    await expect(page.locator('.error-message')).toContainText('Invalid phone number');

    // Test valid phone number
    await page.fill('[data-testid="phone-input"]', '9876543210');
    await page.click('[data-testid="send-otp-button"]');
    await expect(page.locator('[data-testid="otp-input"]')).toBeVisible();
  });

  test('should send OTP and show OTP input', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="phone-input"]', '9876543210');
    await page.click('[data-testid="send-otp-button"]');

    await page.waitForSelector('[data-testid="otp-input"]');
    await expect(page.locator('[data-testid="otp-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="verify-otp-button"]')).toBeVisible();
  });

  test('should verify OTP and login successfully', async ({ page }) => {
    await loginUser(page, config.testPhones.citizen);
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should handle OTP validation', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="phone-input"]', '9876543210');
    await page.click('[data-testid="send-otp-button"]');

    // Test invalid OTP
    await page.fill('[data-testid="otp-input"]', '123');
    await page.click('[data-testid="verify-otp-button"]');
    await expect(page.locator('.error-message')).toContainText('Invalid OTP');
  });

  test('should logout successfully', async ({ page }) => {
    await loginUser(page, config.testPhones.citizen);
    await logout(page);
    await expect(page).toHaveURL(/.*login/);
  });
});

// Test Suite 2: Dashboard Tests
test.describe('Dashboard System', () => {
  test('citizen dashboard should display correctly', async ({ page }) => {
    await loginUser(page, config.testPhones.citizen);

    await expect(page.locator('[data-testid="dashboard-title"]')).toContainText('Dashboard');
    await expect(page.locator('[data-testid="create-grievance-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="my-grievances"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible();
  });

  test('admin dashboard should show admin features', async ({ page }) => {
    await loginUser(page, config.testPhones.admin, 'admin');

    await expect(page.locator('[data-testid="admin-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-grievances"]')).toBeVisible();
  });

  test('officer dashboard should show assignments', async ({ page }) => {
    await loginUser(page, config.testPhones.officer, 'officer');

    await page.goto('/officer/assignments');
    await expect(page.locator('[data-testid="assigned-grievances"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-actions"]')).toBeVisible();
  });
});

// Test Suite 3: Grievance Management Tests
test.describe('Grievance Management', () => {
  test('should create new grievance', async ({ page }) => {
    await loginUser(page, config.testPhones.citizen);

    await page.click('[data-testid="create-grievance-button"]');

    await page.fill('[data-testid="grievance-summary"]', testData.grievance.summary);
    await page.fill('[data-testid="grievance-description"]', testData.grievance.description);
    await page.selectOption('[data-testid="grievance-category"]', testData.grievance.category);
    await page.selectOption('[data-testid="grievance-severity"]', testData.grievance.severity);
    await page.fill('[data-testid="grievance-pincode"]', testData.grievance.pincode);
    await page.fill('[data-testid="grievance-address"]', testData.grievance.address);

    await page.click('[data-testid="submit-grievance-button"]');

    await expect(page.locator('.toast-success')).toContainText('Grievance submitted successfully');
    await expect(page.locator('[data-testid="ticket-id"]')).toBeVisible();
  });

  test('should display grievance list', async ({ page }) => {
    await loginUser(page, config.testPhones.citizen);

    await page.goto('/grievances');
    await expect(page.locator('[data-testid="grievances-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
  });

  test('should view grievance details', async ({ page }) => {
    await loginUser(page, config.testPhones.citizen);

    await page.goto('/grievances');
    await page.click('[data-testid="grievance-row"]:first-child [data-testid="view-button"]');

    await expect(page.locator('[data-testid="grievance-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="grievance-timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="grievance-status"]')).toBeVisible();
  });

  test('should filter grievances by status', async ({ page }) => {
    await loginUser(page, config.testPhones.citizen);

    await page.goto('/grievances');
    await page.selectOption('[data-testid="filter-status"]', 'NEW');

    // Wait for filtered results
    await page.waitForTimeout(1000);

    const statusBadges = page.locator('[data-testid="status-badge"]');
    const count = await statusBadges.count();

    for (let i = 0; i < count; i++) {
      await expect(statusBadges.nth(i)).toContainText('NEW');
    }
  });

  test('should search grievances', async ({ page }) => {
    await loginUser(page, config.testPhones.citizen);

    await page.goto('/grievances');
    await page.fill('[data-testid="search-input"]', 'water');

    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="grievance-row"]')).toContainText(/water/i);
  });
});

// Test Suite 4: Department Management Tests
test.describe('Department Management', () => {
  test('should display departments list', async ({ page }) => {
    await loginUser(page, config.testPhones.admin, 'admin');

    await page.goto('/departments');
    await expect(page.locator('[data-testid="departments-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-department-button"]')).toBeVisible();
  });

  test('should create new department', async ({ page }) => {
    await loginUser(page, config.testPhones.admin, 'admin');
    await createTestDepartment(page);

    await expect(page.locator('[data-testid="departments-table"]')).toContainText(testData.department.name);
  });

  test('should edit department', async ({ page }) => {
    await loginUser(page, config.testPhones.admin, 'admin');

    await page.goto('/departments');
    await page.click('[data-testid="edit-department-button"]:first-child');

    await page.fill('[data-testid="dept-name"]', 'Updated Department Name');
    await page.click('[data-testid="save-department-button"]');

    await expect(page.locator('.toast-success')).toContainText('Department updated successfully');
  });

  test('should delete department', async ({ page }) => {
    await loginUser(page, config.testPhones.admin, 'admin');

    await page.goto('/departments');
    await page.click('[data-testid="delete-department-button"]:last-child');
    await page.click('[data-testid="confirm-delete-button"]');

    await expect(page.locator('.toast-success')).toContainText('Department deleted successfully');
  });
});

// Test Suite 5: Officer Management Tests
test.describe('Officer Management', () => {
  test('should display officers list', async ({ page }) => {
    await loginUser(page, config.testPhones.admin, 'admin');

    await page.goto('/officers');
    await expect(page.locator('[data-testid="officers-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-officer-button"]')).toBeVisible();
  });

  test('should create new officer', async ({ page }) => {
    await loginUser(page, config.testPhones.admin, 'admin');

    await page.goto('/officers');
    await page.click('[data-testid="add-officer-button"]');

    await page.fill('[data-testid="officer-name"]', testData.officer.name);
    await page.fill('[data-testid="officer-role"]', testData.officer.role);
    await page.selectOption('[data-testid="officer-department"]', { index: 1 });
    await page.fill('[data-testid="officer-whatsapp"]', testData.officer.whatsapp);
    await page.fill('[data-testid="officer-email"]', testData.officer.email);
    await page.fill('[data-testid="officer-designation"]', testData.officer.designation);

    await page.click('[data-testid="save-officer-button"]');

    await expect(page.locator('.toast-success')).toContainText('Officer created successfully');
    await expect(page.locator('[data-testid="officers-table"]')).toContainText(testData.officer.name);
  });

  test('should assign officer to grievance', async ({ page }) => {
    await loginUser(page, config.testPhones.admin, 'admin');

    await page.goto('/grievances');
    await page.click('[data-testid="assign-officer-button"]:first-child');

    await page.selectOption('[data-testid="officer-select"]', { index: 1 });
    await page.click('[data-testid="confirm-assignment-button"]');

    await expect(page.locator('.toast-success')).toContainText('Officer assigned successfully');
  });
});

// Test Suite 6: Analytics Tests
test.describe('Analytics Dashboard', () => {
  test('should display analytics overview', async ({ page }) => {
    await loginUser(page, config.testPhones.admin, 'admin');

    await page.goto('/analytics');
    await expect(page.locator('[data-testid="analytics-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="chart-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="performance-metrics"]')).toBeVisible();
  });

  test('should filter analytics by date range', async ({ page }) => {
    await loginUser(page, config.testPhones.admin, 'admin');

    await page.goto('/analytics');
    await page.click('[data-testid="date-filter"]');
    await page.click('[data-testid="last-30-days"]');

    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="analytics-stats"]')).toBeVisible();
  });

  test('should export analytics data', async ({ page }) => {
    await loginUser(page, config.testPhones.admin, 'admin');

    await page.goto('/analytics');

    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-button"]');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('analytics');
  });
});

// Test Suite 7: File Upload Tests
test.describe('File Upload System', () => {
  test('should upload image to grievance', async ({ page }) => {
    await loginUser(page, config.testPhones.citizen);

    // Create a test image file
    const testImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

    await page.goto('/grievances/new');
    await page.setInputFiles('[data-testid="file-upload"]', [
      { name: 'test-image.png', mimeType: 'image/png', buffer: testImage }
    ]);

    await expect(page.locator('[data-testid="file-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-name"]')).toContainText('test-image.png');
  });

  test('should validate file types', async ({ page }) => {
    await loginUser(page, config.testPhones.citizen);

    const invalidFile = Buffer.from('invalid file content');

    await page.goto('/grievances/new');
    await page.setInputFiles('[data-testid="file-upload"]', [
      { name: 'test.exe', mimeType: 'application/octet-stream', buffer: invalidFile }
    ]);

    await expect(page.locator('.error-message')).toContainText('Invalid file type');
  });

  test('should validate file size', async ({ page }) => {
    await loginUser(page, config.testPhones.citizen);

    // Create a large file (simulated)
    const largeFile = Buffer.alloc(10 * 1024 * 1024); // 10MB

    await page.goto('/grievances/new');
    await page.setInputFiles('[data-testid="file-upload"]', [
      { name: 'large-file.png', mimeType: 'image/png', buffer: largeFile }
    ]);

    await expect(page.locator('.error-message')).toContainText('File too large');
  });
});

// Test Suite 8: Language Support Tests
test.describe('Multi-language Support', () => {
  test('should switch to Marathi language', async ({ page }) => {
    await page.goto('/login');

    await page.click('[data-testid="language-marathi"]');
    await expect(page.locator('h2')).toContainText('लॉगिन करा');
  });

  test('should switch to Hindi language', async ({ page }) => {
    await page.goto('/login');

    await page.click('[data-testid="language-hindi"]');
    await expect(page.locator('h2')).toContainText('लॉग इन करें');
  });

  test('should switch to English language', async ({ page }) => {
    await page.goto('/login');

    await page.click('[data-testid="language-english"]');
    await expect(page.locator('h2')).toContainText('Login');
  });

  test('should persist language preference', async ({ page }) => {
    await page.goto('/login');
    await page.click('[data-testid="language-marathi"]');

    await page.reload();
    await expect(page.locator('h2')).toContainText('लॉगिन करा');
  });
});

// Test Suite 9: Settings Tests
test.describe('Settings Management', () => {
  test('should display user settings', async ({ page }) => {
    await loginUser(page, config.testPhones.citizen);

    await page.goto('/settings');
    await expect(page.locator('[data-testid="profile-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="language-settings"]')).toBeVisible();
    await expect(page.locator('[data-testid="notification-settings"]')).toBeVisible();
  });

  test('should update profile information', async ({ page }) => {
    await loginUser(page, config.testPhones.citizen);

    await page.goto('/settings');
    await page.fill('[data-testid="user-name"]', 'Updated User Name');
    await page.fill('[data-testid="user-email"]', 'updated@example.com');
    await page.click('[data-testid="save-profile-button"]');

    await expect(page.locator('.toast-success')).toContainText('Profile updated successfully');
  });

  test('should update notification preferences', async ({ page }) => {
    await loginUser(page, config.testPhones.citizen);

    await page.goto('/settings');
    await page.check('[data-testid="whatsapp-notifications"]');
    await page.check('[data-testid="email-notifications"]');
    await page.click('[data-testid="save-notifications-button"]');

    await expect(page.locator('.toast-success')).toContainText('Notification preferences updated');
  });
});

// Test Suite 10: Status Tracking Tests
test.describe('Grievance Status Tracking', () => {
  test('should track grievance status publicly', async ({ page }) => {
    // Simulate accessing public status page
    const ticketId = 'JD2024001';

    await page.goto(`/status/${ticketId}`);
    await expect(page.locator('[data-testid="ticket-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="status-timeline"]')).toBeVisible();
  });

  test('should display status updates', async ({ page }) => {
    const ticketId = 'JD2024001';

    await page.goto(`/status/${ticketId}`);
    await expect(page.locator('[data-testid="status-updates"]')).toBeVisible();
    await expect(page.locator('[data-testid="last-updated"]')).toBeVisible();
  });

  test('should handle invalid ticket ID', async ({ page }) => {
    await page.goto('/status/INVALID123');
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Ticket not found');
  });
});

// Test Suite 11: Performance Tests
test.describe('Performance & Load Tests', () => {
  test('should load dashboard within 3 seconds', async ({ page }) => {
    await loginUser(page, config.testPhones.citizen);

    const startTime = Date.now();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle multiple simultaneous users', async ({ browser }) => {
    const promises = [];

    for (let i = 0; i < 5; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();

      promises.push(
        loginUser(page, config.testPhones.citizen).then(() => {
          return page.goto('/dashboard');
        })
      );
    }

    await Promise.all(promises);
  });
});

// Test Suite 12: Error Handling Tests
test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    await page.route('**/api/**', route => route.abort());

    await page.goto('/login');
    await page.fill('[data-testid="phone-input"]', '9876543210');
    await page.click('[data-testid="send-otp-button"]');

    await expect(page.locator('.error-message')).toContainText(/network|connection/i);
  });

  test('should handle server errors', async ({ page }) => {
    await page.route('**/api/**', route =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server Error' }) })
    );

    await page.goto('/login');
    await page.fill('[data-testid="phone-input"]', '9876543210');
    await page.click('[data-testid="send-otp-button"]');

    await expect(page.locator('.error-message')).toContainText(/server error|something went wrong/i);
  });

  test('should handle authentication errors', async ({ page }) => {
    await page.route('**/api/auth/**', route =>
      route.fulfill({ status: 401, body: JSON.stringify({ error: 'Unauthorized' }) })
    );

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });
});

// Test Suite 13: Mobile Responsiveness Tests
test.describe('Mobile Responsiveness', () => {
  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/login');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="phone-input"]')).toBeVisible();
  });

  test('should handle touch interactions', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await loginUser(page, config.testPhones.citizen);
    await page.tap('[data-testid="user-menu"]');
    await expect(page.locator('[data-testid="dropdown-menu"]')).toBeVisible();
  });
});

// Test Suite 14: Accessibility Tests
test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/login');

    const h1 = await page.locator('h1').count();
    const h2 = await page.locator('h2').count();

    expect(h1).toBeGreaterThan(0);
    expect(h2).toBeGreaterThan(0);
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/login');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/login');

    await page.press('body', 'Tab');
    await expect(page.locator(':focus')).toBeVisible();

    await page.press('body', 'Tab');
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/login');

    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
      const text = await buttons.nth(i).textContent();

      expect(ariaLabel || text).toBeTruthy();
    }
  });
});

// Test Suite 15: Integration Tests
test.describe('End-to-End Integration', () => {
  test('complete grievance workflow', async ({ page }) => {
    // Citizen creates grievance
    await loginUser(page, config.testPhones.citizen);
    await page.click('[data-testid="create-grievance-button"]');

    await page.fill('[data-testid="grievance-summary"]', testData.grievance.summary);
    await page.fill('[data-testid="grievance-description"]', testData.grievance.description);
    await page.selectOption('[data-testid="grievance-category"]', testData.grievance.category);
    await page.click('[data-testid="submit-grievance-button"]');

    const ticketId = await page.locator('[data-testid="ticket-id"]').textContent();
    await logout(page);

    // Admin assigns officer
    await loginUser(page, config.testPhones.admin, 'admin');
    await page.goto('/grievances');
    await page.click(`[data-ticket-id="${ticketId}"] [data-testid="assign-officer-button"]`);
    await page.selectOption('[data-testid="officer-select"]', { index: 1 });
    await page.click('[data-testid="confirm-assignment-button"]');
    await logout(page);

    // Officer updates status
    await loginUser(page, config.testPhones.officer, 'officer');
    await page.goto('/officer/assignments');
    await page.click(`[data-ticket-id="${ticketId}"] [data-testid="update-status-button"]`);
    await page.selectOption('[data-testid="status-select"]', 'IN_PROGRESS');
    await page.fill('[data-testid="status-notes"]', 'Investigation started');
    await page.click('[data-testid="save-status-button"]');
    await logout(page);

    // Verify public status
    await page.goto(`/status/${ticketId}`);
    await expect(page.locator('[data-testid="status-badge"]')).toContainText('IN_PROGRESS');
  });
});