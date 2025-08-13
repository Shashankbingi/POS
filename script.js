document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const navButtons = {
        inventory: document.getElementById('nav-inventory'),
        sales: document.getElementById('nav-sales'),
        dashboard: document.getElementById('nav-dashboard')
    };

    const sections = {
        inventory: document.getElementById('inventory-section'),
        sales: document.getElementById('sales-section'),
        dashboard: document.getElementById('dashboard-section')
    };

    // Inventory Section Elements
    const inventorySearchInput = document.getElementById('inventory-search');
    const scanInventoryBarcodeBtn = document.getElementById('scan-inventory-barcode');
    const inventoryTableBody = document.querySelector('#inventory-table tbody');
    const addItemBtn = document.getElementById('add-item-btn');
    const updateItemBtn = document.getElementById('update-item-btn');
    const deleteItemBtn = document.getElementById('delete-item-btn');

    const itemModal = document.getElementById('item-modal');
    const modalTitle = document.getElementById('modal-title');
    const itemForm = document.getElementById('item-form');
    const itemBarcodeInput = document.getElementById('item-barcode');
    const scanModalBarcodeBtn = document.getElementById('scan-modal-barcode');
    const itemDescriptionInput = document.getElementById('item-description');
    const itemMrpInput = document.getElementById('item-mrp');
    const itemQuantityInput = document.getElementById('item-quantity');
    const saveItemBtn = document.getElementById('save-item-btn');
    const closeModalButtons = document.querySelectorAll('.close-button');

    // Sales Section Elements
    const currentDateSpan = document.getElementById('current-date');
    const totalAmountSpan = document.getElementById('total-amount');
    const salesSearchInput = document.getElementById('sales-search');
    const scanSalesBarcodeBtn = document.getElementById('scan-sales-barcode');
    const salesSuggestionsList = document.getElementById('sales-suggestions');
    const cartItemsContainer = document.getElementById('cart-items');
    const payCashBtn = document.getElementById('pay-cash');
    const payCardBtn = document.getElementById('pay-card');
    const payUpiBtn = document.getElementById('pay-upi');

    const cashModal = document.getElementById('cash-modal');
    const cashModalTotal = document.getElementById('cash-modal-total');
    const cashReceivedInput = document.getElementById('cash-received');
    const confirmCashPaymentBtn = document.getElementById('confirm-cash-payment');

    const upiModal = document.getElementById('upi-modal');
    const upiQrCanvas = document.getElementById('upi-qr-canvas'); // Changed from img to canvas
    const upiLinkDisplay = document.getElementById('upi-link-display');
    const confirmUpiPaymentBtn = document.getElementById('confirm-upi-payment');

    // Barcode Scanner Modal Elements
    const barcodeScannerModal = document.getElementById('barcode-scanner-modal');
    const barcodeVideo = document.getElementById('barcode-video');
    const barcodeScanResult = document.getElementById('barcode-scan-result');
    const stopBarcodeScanBtn = document.getElementById('stop-barcode-scan');

    // Dashboard Section Elements
    const dashTotalSales = document.getElementById('dash-total-sales');
    const dashTotalBills = document.getElementById('dash-total-bills');
    const dashAvgBill = document.getElementById('dash-avg-bill');
    const dashCategorySalesList = document.getElementById('dash-category-sales');
    const transactionsTableBody = document.querySelector('#transactions-table tbody');

    // --- Global Data (Simulated Backend) ---
    // In a real application, these would be fetched from a backend API.
    // Example: fetch('/api/inventory').then(res => res.json()).then(data => inventoryData = data);
    let inventoryData = [
        { id: 1, barcode: '123456789012', description: 'Milk (1L)', mrp: 60.00, quantity: 50 },
        { id: 2, barcode: '987654321098', description: 'Bread (Whole Wheat)', mrp: 40.00, quantity: 30 },
        { id: 3, barcode: '543210987654', description: 'Eggs (Dozen)', mrp: 90.00, quantity: 20 },
        { id: 4, barcode: '112233445566', description: 'Coffee Powder (200g)', mrp: 250.00, quantity: 15 },
        { id: 5, barcode: '665544332211', description: 'Sugar (1kg)', mrp: 55.00, quantity: 100 }
    ];
    let nextInventoryId = 6; // Used for simulated adds

    let salesCart = {}; // { itemKey: quantity }
    let salesItemDict = {}; // { itemKey: {id, barcode, name, mrp, qty} } derived from inventory

    let transactionsData = [
        { bill_no: 'CA1001', date: new Date('2023-10-26T10:30:00'), total_amount: 150.00, category: 'Cash' },
        { bill_no: 'UP1002', date: new Date('2023-10-26T11:00:00'), total_amount: 200.00, category: 'UPI' },
        { bill_no: 'CR1003', date: new Date('2023-10-26T11:45:00'), total_amount: 300.00, category: 'Card' },
        { bill_no: 'CA1004', date: new Date('2023-10-26T12:15:00'), total_amount: 75.00, category: 'Cash' },
        { bill_no: 'UP1005', date: new Date('2023-10-26T13:00:00'), total_amount: 120.00, category: 'UPI' },
        { bill_no: 'CR1006', date: new Date('2023-10-26T14:00:00'), total_amount: 450.00, category: 'Card' },
        { bill_no: 'CA1007', date: new Date('2023-10-26T15:00:00'), total_amount: 95.00, category: 'Cash' },
        { bill_no: 'UP1008', date: new Date('2023-10-26T16:00:00'), total_amount: 180.00, category: 'UPI' },
    ];
    let nextBillNumber = { 'CA': 1009, 'UP': 1009, 'CR': 1009 }; // Used for simulated bill numbers

    // --- Utility Functions ---
    function showSection(sectionId) {
        Object.values(sections).forEach(section => section.classList.remove('active-section'));
        Object.values(navButtons).forEach(button => button.classList.remove('active'));
        sections[sectionId].classList.add('active-section');
        navButtons[sectionId].classList.add('active');

        // Refresh data when section changes
        if (sectionId === 'inventory') {
            loadInventoryTable();
        } else if (sectionId === 'sales') {
            loadSalesItemDict();
            updateSalesDate();
            refreshCartDisplay();
        } else if (sectionId === 'dashboard') {
            loadDashboardSummary();
        }
    }

    function openModal(modalElement) {
        modalElement.style.display = 'flex'; // Use flex to center
    }

    function closeModal(modalElement) {
        modalElement.style.display = 'none';
        // Stop barcode scanner if it's open
        if (modalElement === barcodeScannerModal) {
            stopBarcodeScanner();
        }
    }

    // --- Barcode Scanning Integration (Placeholder) ---
    let barcodeScanner = null; // Will hold the ZXing/Quagga instance
    let currentBarcodeTargetInput = null; // To know which input to fill after scan

    async function startBarcodeScanner(targetInput) {
        currentBarcodeTargetInput = targetInput;
        barcodeScanResult.textContent = 'Scanning...';
        openModal(barcodeScannerModal);

        // --- REAL BARCODE SCANNER INTEGRATION ---
        // This is where you would integrate a library like ZXing-JS or QuaggaJS.
        // Example using ZXing-JS (assuming it's loaded via script tag):
        /*
        if (typeof ZXing !== 'undefined') {
            const codeReader = new ZXing.BrowserMultiFormatReader();
            barcodeScanner = codeReader; // Store for stopping later

            try {
                const videoInputDevices = await codeReader.getVideoInputDevices();
                if (videoInputDevices.length > 0) {
                    const selectedDeviceId = videoInputDevices[0].deviceId; // Or let user choose
                    codeReader.decodeFromVideoDevice(selectedDeviceId, barcodeVideo, (result, err) => {
                        if (result) {
                            barcodeScanResult.textContent = `Found: ${result.text}`;
                            currentBarcodeTargetInput.value = result.text;
                            // Optionally, trigger a post-scan action here
                            if (currentBarcodeTargetInput === salesSearchInput) {
                                // Simulate adding item by barcode for sales
                                const itemKey = Object.keys(salesItemDict).find(key => salesItemDict[key].barcode === result.text);
                                if (itemKey) {
                                    addItemToCart(itemKey);
                                    salesSearchInput.value = '';
                                    salesSuggestionsList.style.display = 'none';
                                } else {
                                    alert('Item not found with this barcode.');
                                }
                            }
                            stopBarcodeScanner();
                            closeModal(barcodeScannerModal);
                        }
                        if (err && !(err instanceof ZXing.NotFoundException)) {
                            console.error(err);
                            barcodeScanResult.textContent = `Error: ${err.message}`;
                        }
                    });
                } else {
                    barcodeScanResult.textContent = 'No video input devices found.';
                }
            } catch (err) {
                console.error('Error starting barcode scanner:', err);
                barcodeScanResult.textContent = `Error: ${err.message}`;
            }
        } else {
            barcodeScanResult.textContent = 'ZXing-JS library not loaded. Simulating scan.';
            // Fallback to simulated scan if library not present
            simulateBarcodeScan(targetInput);
        }
        */
        // --- END REAL BARCODE SCANNER INTEGRATION ---

        // Fallback/Simulated Scan if real scanner not integrated or fails
        simulateBarcodeScan(targetInput);
    }

    function simulateBarcodeScan(targetInput) {
        // This is the current simulated behavior
        const simulatedBarcode = prompt("Enter barcode (e.g., 123456789012):");
        if (simulatedBarcode) {
            targetInput.value = simulatedBarcode;
            barcodeScanResult.textContent = `Simulated Scan: ${simulatedBarcode}`;
            // If it's the sales search input, try to add the item
            if (targetInput === salesSearchInput) {
                const itemKey = Object.keys(salesItemDict).find(key => salesItemDict[key].barcode === simulatedBarcode);
                if (itemKey) {
                    addItemToCart(itemKey);
                    salesSearchInput.value = '';
                    salesSuggestionsList.style.display = 'none';
                } else {
                    alert('Item not found with this barcode.');
                }
            }
        } else {
            barcodeScanResult.textContent = 'Scan cancelled.';
        }
        closeModal(barcodeScannerModal); // Close after simulated scan
    }

    function stopBarcodeScanner() {
        if (barcodeScanner) {
            barcodeScanner.reset(); // For ZXing-JS
            barcodeScanner = null;
        }
        barcodeVideo.srcObject = null; // Stop camera stream
    }

    stopBarcodeScanBtn.addEventListener('click', () => {
        closeModal(barcodeScannerModal);
    });

    // --- Inventory Functions ---
    async function loadInventoryTable(searchQuery = '') {
        // --- REAL BACKEND API CALL ---
        // In a real app, you'd fetch data from your backend:
        // try {
        //     const response = await fetch(`/api/inventory?search=${encodeURIComponent(searchQuery)}`);
        //     const data = await response.json();
        //     inventoryData = data; // Update local data with fetched data
        // } catch (error) {
        //     console.error('Error fetching inventory:', error);
        //     alert('Failed to load inventory.');
        //     inventoryData = []; // Clear data on error
        // }
        // --- END REAL BACKEND API CALL ---

        inventoryTableBody.innerHTML = '';
        const filteredData = inventoryData.filter(item =>
            item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.barcode.toLowerCase().includes(searchQuery.toLowerCase())
        );

        filteredData.forEach(item => {
            const row = inventoryTableBody.insertRow();
            row.dataset.itemId = item.id; // Store ID for selection
            row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.barcode}</td>
                <td>${item.description}</td>
                <td>₹${item.mrp.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>
                    <button class="select-item-btn" data-id="${item.id}">Select</button>
                </td>
            `;
        });
    }

    function handleInventorySearch() {
        loadInventoryTable(inventorySearchInput.value);
    }

    let selectedInventoryItemId = null; // To keep track of selected item for update/delete

    inventoryTableBody.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('select-item-btn')) {
            const itemId = parseInt(target.dataset.id);
            // Remove previous selection highlight
            const previouslySelectedRow = inventoryTableBody.querySelector('.selected-row');
            if (previouslySelectedRow) {
                previouslySelectedRow.classList.remove('selected-row');
            }
            // Add highlight to current row
            target.closest('tr').classList.add('selected-row');
            selectedInventoryItemId = itemId;
        }
    });

    addItemBtn.addEventListener('click', () => {
        modalTitle.textContent = 'Add Item';
        itemForm.reset();
        selectedInventoryItemId = null; // Clear selection for add
        openModal(itemModal);
    });

    updateItemBtn.addEventListener('click', () => {
        if (selectedInventoryItemId === null) {
            alert('Please select an item to update.');
            return;
        }
        const itemToUpdate = inventoryData.find(item => item.id === selectedInventoryItemId);
        if (itemToUpdate) {
            modalTitle.textContent = 'Update Item';
            itemBarcodeInput.value = itemToUpdate.barcode;
            itemDescriptionInput.value = itemToUpdate.description;
            itemMrpInput.value = itemToUpdate.mrp;
            itemQuantityInput.value = itemToUpdate.quantity;
            openModal(itemModal);
        }
    });

    deleteItemBtn.addEventListener('click', async () => {
        if (selectedInventoryItemId === null) {
            alert('Please select an item to delete.');
            return;
        }
        if (confirm('Are you sure you want to delete this item?')) {
            // --- REAL BACKEND API CALL ---
            // try {
            //     const response = await fetch(`/api/inventory/${selectedInventoryItemId}`, { method: 'DELETE' });
            //     if (!response.ok) throw new Error('Failed to delete item');
            //     inventoryData = inventoryData.filter(item => item.id !== selectedInventoryItemId);
            //     alert('Item deleted successfully!');
            // } catch (error) {
            //     console.error('Error deleting item:', error);
            //     alert('Failed to delete item.');
            // }
            // --- END REAL BACKEND API CALL ---

            // Simulated delete
            inventoryData = inventoryData.filter(item => item.id !== selectedInventoryItemId);
            alert('Item deleted successfully!');

            selectedInventoryItemId = null; // Clear selection
            loadInventoryTable();
        }
    });

    itemForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const barcode = itemBarcodeInput.value.trim();
        const description = itemDescriptionInput.value.trim();
        const mrp = parseFloat(itemMrpInput.value);
        const quantity = parseInt(itemQuantityInput.value);

        if (!barcode || !description || isNaN(mrp) || isNaN(quantity)) {
            alert('Please fill all fields correctly.');
            return;
        }

        if (selectedInventoryItemId === null) {
            // Add new item
            const newItem = {
                barcode,
                description,
                mrp,
                quantity
            };
            // --- REAL BACKEND API CALL ---
            // try {
            //     const response = await fetch('/api/inventory', {
            //         method: 'POST',
            //         headers: { 'Content-Type': 'application/json' },
            //         body: JSON.stringify(newItem)
            //     });
            //     if (!response.ok) throw new Error('Failed to add item');
            //     const addedItem = await response.json(); // Backend might return item with ID
            //     inventoryData.push(addedItem);
            //     alert('Item added successfully!');
            // } catch (error) {
            //     console.error('Error adding item:', error);
            //     alert('Failed to add item.');
            // }
            // --- END REAL BACKEND API CALL ---

            // Simulated add
            newItem.id = nextInventoryId++; // Assign simulated ID
            inventoryData.push(newItem);
            alert('Item added successfully!');

        } else {
            // Update existing item
            const updatedItem = {
                id: selectedInventoryItemId, // Ensure ID is sent for update
                barcode,
                description,
                mrp,
                quantity
            };
            // --- REAL BACKEND API CALL ---
            // try {
            //     const response = await fetch(`/api/inventory/${selectedInventoryItemId}`, {
            //         method: 'PUT',
            //         headers: { 'Content-Type': 'application/json' },
            //         body: JSON.stringify(updatedItem)
            //     });
            //     if (!response.ok) throw new Error('Failed to update item');
            //     const itemIndex = inventoryData.findIndex(item => item.id === selectedInventoryItemId);
            //     if (itemIndex !== -1) inventoryData[itemIndex] = updatedItem;
            //     alert('Item updated successfully!');
            // } catch (error) {
            //     console.error('Error updating item:', error);
            //     alert('Failed to update item.');
            // }
            // --- END REAL BACKEND API CALL ---

            // Simulated update
            const itemIndex = inventoryData.findIndex(item => item.id === selectedInventoryItemId);
            if (itemIndex !== -1) {
                inventoryData[itemIndex] = updatedItem;
            }
            alert('Item updated successfully!');
        }
        closeModal(itemModal);
        loadInventoryTable();
    });

    closeModalButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const modal = event.target.closest('.modal');
            if (modal) {
                closeModal(modal);
            }
        });
    });

    // Close modal if clicked outside content
    window.addEventListener('click', (event) => {
        if (event.target === itemModal) closeModal(itemModal);
        if (event.target === cashModal) closeModal(cashModal);
        if (event.target === upiModal) closeModal(upiModal);
        if (event.target === barcodeScannerModal) closeModal(barcodeScannerModal);
    });

    // --- Sales Functions ---
    function updateSalesDate() {
        const today = new Date();
        currentDateSpan.textContent = `📅 Date: ${today.toLocaleDateString('en-GB')}`;
    }

    function loadSalesItemDict() {
        // This would also be part of the inventory fetch from backend
        salesItemDict = {};
        inventoryData.forEach(item => {
            const key = `${item.description}--${item.mrp.toFixed(2)}`;
            salesItemDict[key] = {
                id: item.id,
                barcode: item.barcode,
                name: item.description,
                mrp: item.mrp,
                qty: item.quantity // Current stock quantity
            };
        });
    }

    function updateSalesTotal() {
        let total = 0;
        for (const key in salesCart) {
            if (salesCart.hasOwnProperty(key) && salesItemDict[key]) {
                total += salesCart[key] * salesItemDict[key].mrp;
            }
        }
        totalAmountSpan.textContent = `Total: ₹${total.toFixed(2)}`;
        return total;
    }

    function refreshCartDisplay() {
        cartItemsContainer.innerHTML = '';
        for (const itemKey in salesCart) {
            if (salesCart.hasOwnProperty(itemKey) && salesItemDict[itemKey]) {
                const item = salesItemDict[itemKey];
                const quantity = salesCart[itemKey];
                const itemTotal = quantity * item.mrp;

                const cartItemDiv = document.createElement('div');
                cartItemDiv.classList.add('cart-item');
                cartItemDiv.innerHTML = `
                    <span>${item.name}</span>
                    <input type="number" class="cart-qty-input" value="${quantity}" min="1" data-item-key="${itemKey}">
                    <span class="item-total">₹${itemTotal.toFixed(2)}</span>
                    <button class="remove-from-cart" data-item-key="${itemKey}">🗑️</button>
                `;
                cartItemsContainer.appendChild(cartItemDiv);
            }
        }
        updateSalesTotal();
    }

    function addItemToCart(itemKey) {
        if (!salesItemDict[itemKey]) return;

        if (salesCart[itemKey]) {
            salesCart[itemKey]++;
        } else {
            salesCart[itemKey] = 1;
        }
        refreshCartDisplay();
    }

    function removeItemFromCart(itemKey) {
        delete salesCart[itemKey];
        refreshCartDisplay();
    }

    function updateCartItemQuantity(itemKey, newQuantity) {
        if (newQuantity <= 0) {
            removeItemFromCart(itemKey);
        } else {
            salesCart[itemKey] = newQuantity;
        }
        refreshCartDisplay();
    }

    cartItemsContainer.addEventListener('change', (event) => {
        if (event.target.classList.contains('cart-qty-input')) {
            const itemKey = event.target.dataset.itemKey;
            const newQty = parseInt(event.target.value);
            if (!isNaN(newQty)) {
                updateCartItemQuantity(itemKey, newQty);
            }
        }
    });

    cartItemsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-from-cart')) {
            const itemKey = event.target.dataset.itemKey;
            removeItemFromCart(itemKey);
        }
    });

    salesSearchInput.addEventListener('input', () => {
        const typed = salesSearchInput.value.toLowerCase();
        salesSuggestionsList.innerHTML = '';
        if (typed) {
            let count = 0;
            for (const key in salesItemDict) {
                if (salesItemDict.hasOwnProperty(key)) {
                    const item = salesItemDict[key];
                    if (item.name.toLowerCase().includes(typed) || item.barcode.toLowerCase().includes(typed)) {
                        const li = document.createElement('li');
                        li.textContent = `${item.name} (₹${item.mrp.toFixed(2)})`;
                        li.dataset.itemKey = key;
                        salesSuggestionsList.appendChild(li);
                        count++;
                        if (count >= 8) break; // Limit suggestions
                    }
                }
            }
            if (count > 0) {
                salesSuggestionsList.style.display = 'block';
            } else {
                salesSuggestionsList.style.display = 'none';
            }
        } else {
            salesSuggestionsList.style.display = 'none';
        }
    });

    salesSuggestionsList.addEventListener('click', (event) => {
        if (event.target.tagName === 'LI') {
            const itemKey = event.target.dataset.itemKey;
            addItemToCart(itemKey);
            salesSearchInput.value = '';
            salesSuggestionsList.style.display = 'none';
        }
    });

    // Trigger barcode scanner for inventory search
    scanInventoryBarcodeBtn.addEventListener('click', () => startBarcodeScanner(inventorySearchInput));
    // Trigger barcode scanner for sales search
    scanSalesBarcodeBtn.addEventListener('click', () => startBarcodeScanner(salesSearchInput));
    // Trigger barcode scanner for item modal barcode input
    scanModalBarcodeBtn.addEventListener('click', () => startBarcodeScanner(itemBarcodeInput));


    // Payment Processing
    function generateBillNo(prefix) {
        const currentNum = nextBillNumber[prefix] || 1001;
        nextBillNumber[prefix] = currentNum + 1;
        return `${prefix}${currentNum}`;
    }

    async function saveTransaction(billNo, total, category) {
        const transaction = {
            bill_no: billNo,
            date: new Date(),
            total_amount: total,
            category: category,
            cart_items: salesCart // Include cart items for detailed transaction
        };

        // --- REAL BACKEND API CALL ---
        // try {
        //     const response = await fetch('/api/transactions', {
        //         method: 'POST',
        //         headers: { 'Content-Type': 'application/json' },
        //         body: JSON.stringify(transaction)
        //     });
        //     if (!response.ok) throw new Error('Failed to save transaction');
        //     const savedTransaction = await response.json(); // Backend might return saved transaction
        //     transactionsData.push(savedTransaction); // Add to local data
        //     // Also, update inventory quantities on the backend here
        //     // e.g., await fetch('/api/inventory/deduct', { method: 'POST', body: JSON.stringify(salesCart) });
        //     alert(`Transaction saved! Bill No: ${billNo}`);
        // } catch (error) {
        //     console.error('Error saving transaction:', error);
        //     alert('Failed to save transaction.');
        // }
        // --- END REAL BACKEND API CALL ---

        // Simulated save
        transactionsData.push(transaction);
        alert(`Transaction saved! Bill No: ${billNo}`);

        salesCart = {}; // Clear cart
        refreshCartDisplay();
    }

    payCashBtn.addEventListener('click', () => {
        const total = updateSalesTotal();
        if (total === 0) {
            alert('Cart is empty!');
            return;
        }
        cashModalTotal.textContent = `Total: ₹${total.toFixed(2)}`;
        cashReceivedInput.value = '';
        openModal(cashModal);
    });

    confirmCashPaymentBtn.addEventListener('click', async () => {
        const total = parseFloat(cashModalTotal.textContent.replace('Total: ₹', ''));
        const paid = parseFloat(cashReceivedInput.value);

        if (isNaN(paid) || paid < total) {
            alert('Insufficient amount received!');
            return;
        }

        const change = paid - total;
        const billNo = generateBillNo('CA');
        await saveTransaction(billNo, total, 'Cash'); // Use await for simulated save too
        alert(`Change to return: ₹${change.toFixed(2)}\nBill No: ${billNo}`);
        closeModal(cashModal);
    });

    payCardBtn.addEventListener('click', async () => {
        const total = updateSalesTotal();
        if (total === 0) {
            alert('Cart is empty!');
            return;
        }
        if (confirm(`Confirm Card Payment of ₹${total.toFixed(2)}?`)) {
            const billNo = generateBillNo('CR');
            await saveTransaction(billNo, total, 'Card');
        }
    });

    payUpiBtn.addEventListener('click', () => {
        const total = updateSalesTotal();
        if (total === 0) {
            alert('Cart is empty!');
            return;
        }
        const upiId = "shashank.bingi1@ybl"; // From Python code
        const name = "Advaita pooja store"; // From Python code
        const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${total.toFixed(2)}&cu=INR`;

        upiLinkDisplay.textContent = upiLink;

        // --- REAL QR CODE GENERATION ---
        // This is where you would integrate a library like qrcode.js
        /*
        if (typeof QRCode !== 'undefined') {
            upiQrCanvas.innerHTML = ''; // Clear previous QR
            new QRCode(upiQrCanvas, {
                text: upiLink,
                width: 200,
                height: 200,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
        } else {
            // Fallback if qrcode.js is not loaded
            console.warn('qrcode.js library not loaded. QR code will not be generated.');
            upiQrCanvas.innerHTML = '<p>QR Code library not loaded.</p>';
        }
        */
        // --- END REAL QR CODE GENERATION ---

        // For demonstration without qrcode.js, you could use a static image or a placeholder
        // upiQrCanvas.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}" alt="UPI QR Code">`;
        // Or just clear it if no library is present
        upiQrCanvas.innerHTML = ''; // Clear canvas if no library is used to draw on it

        openModal(upiModal);
    });

    confirmUpiPaymentBtn.addEventListener('click', async () => {
        const total = updateSalesTotal();
        const billNo = generateBillNo('UP');
        await saveTransaction(billNo, total, 'UPI');
        closeModal(upiModal);
    });

    // --- Dashboard Functions ---
    async function loadDashboardSummary() {
        // --- REAL BACKEND API CALL ---
        // try {
        //     const response = await fetch('/api/dashboard/summary');
        //     const data = await response.json();
        //     // Update dashboard elements with data.totalSales, data.totalBills, etc.
        //     // transactionsData = data.recentTransactions; // Update recent transactions
        // } catch (error) {
        //     console.error('Error fetching dashboard summary:', error);
        //     alert('Failed to load dashboard summary.');
        // }
        // --- END REAL BACKEND API CALL ---

        let totalSales = 0;
        let totalBills = transactionsData.length;
        let categorySales = { 'Cash': 0, 'Card': 0, 'UPI': 0 };

        transactionsData.forEach(tx => {
            totalSales += tx.total_amount;
            if (categorySales.hasOwnProperty(tx.category)) {
                categorySales[tx.category] += tx.total_amount;
            }
        });

        const avgBill = totalBills > 0 ? totalSales / totalBills : 0;

        dashTotalSales.textContent = `₹${totalSales.toFixed(2)}`;
        dashTotalBills.textContent = totalBills;
        dashAvgBill.textContent = `₹${avgBill.toFixed(2)}`;

        dashCategorySalesList.innerHTML = '';
        for (const category in categorySales) {
            if (categorySales.hasOwnProperty(category)) {
                const li = document.createElement('li');
                li.innerHTML = `<span>${category} Sales:</span> <span>₹${categorySales[category].toFixed(2)}</span>`;
                dashCategorySalesList.appendChild(li);
            }
        }

        transactionsTableBody.innerHTML = '';
        // Sort by date descending and take top 8, similar to Python
        const recentTxns = [...transactionsData].sort((a, b) => b.date - a.date).slice(0, 8);
        recentTxns.forEach(tx => {
            const row = transactionsTableBody.insertRow();
            row.innerHTML = `
                <td>${tx.bill_no}</td>
                <td>${tx.date.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td>₹${tx.total_amount.toFixed(2)}</td>
                <td>${tx.category}</td>
            `;
        });
    }

    // --- Event Listeners for Navigation ---
    navButtons.inventory.addEventListener('click', () => showSection('inventory'));
    navButtons.sales.addEventListener('click', () => showSection('sales'));
    navButtons.dashboard.addEventListener('click', () => showSection('dashboard'));

    // --- Initial Load ---
    showSection('inventory'); // Start with inventory section
    loadInventoryTable();
    loadSalesItemDict(); // Initialize sales item dictionary
    updateSalesDate();
});
