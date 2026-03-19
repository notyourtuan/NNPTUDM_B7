var express = require('express');
var router = express.Router();

let inventoryModel = require('../schemas/inventories');
let productModel = require('../schemas/products');

async function validateProductAndQuantity(productId, quantity) {
    if (!productId) {
        return {
            ok: false,
            message: 'product is required'
        };
    }
    if (typeof quantity !== 'number' || quantity <= 0) {
        return {
            ok: false,
            message: 'quantity must be a number greater than 0'
        };
    }
    let product = await productModel.findOne({
        _id: productId,
        isDeleted: false
    });
    if (!product) {
        return {
            ok: false,
            message: 'product not found'
        };
    }
    return {
        ok: true
    };
}

router.get('/', async function (req, res) {
    let data = await inventoryModel.find({}).populate('product');
    res.send(data);
});

router.get('/:id', async function (req, res) {
    try {
        let result = await inventoryModel.findOne({
            _id: req.params.id
        }).populate('product');
        if (!result) {
            return res.status(404).send({
                message: 'ID NOT FOUND'
            });
        }
        res.send(result);
    } catch (error) {
        res.status(404).send({
            message: error.message
        });
    }
});

router.post('/add-stock', async function (req, res) {
    try {
        let product = req.body.product;
        let quantity = Number(req.body.quantity);
        let validation = await validateProductAndQuantity(product, quantity);
        if (!validation.ok) {
            return res.status(400).send({
                message: validation.message
            });
        }
        let inventory = await inventoryModel.findOneAndUpdate(
            { product: product },
            { $inc: { stock: quantity } },
            { new: true }
        ).populate('product');
        if (!inventory) {
            return res.status(404).send({
                message: 'inventory not found'
            });
        }
        res.send(inventory);
    } catch (error) {
        res.status(400).send({
            message: error.message
        });
    }
});

router.post('/remove-stock', async function (req, res) {
    try {
        let product = req.body.product;
        let quantity = Number(req.body.quantity);
        let validation = await validateProductAndQuantity(product, quantity);
        if (!validation.ok) {
            return res.status(400).send({
                message: validation.message
            });
        }
        let inventory = await inventoryModel.findOne({ product: product });
        if (!inventory) {
            return res.status(404).send({
                message: 'inventory not found'
            });
        }
        if (inventory.stock < quantity) {
            return res.status(400).send({
                message: 'stock is not enough'
            });
        }
        inventory.stock -= quantity;
        await inventory.save();
        await inventory.populate('product');
        res.send(inventory);
    } catch (error) {
        res.status(400).send({
            message: error.message
        });
    }
});

router.post('/reservation', async function (req, res) {
    try {
        let product = req.body.product;
        let quantity = Number(req.body.quantity);
        let validation = await validateProductAndQuantity(product, quantity);
        if (!validation.ok) {
            return res.status(400).send({
                message: validation.message
            });
        }
        let inventory = await inventoryModel.findOne({ product: product });
        if (!inventory) {
            return res.status(404).send({
                message: 'inventory not found'
            });
        }
        if (inventory.stock < quantity) {
            return res.status(400).send({
                message: 'stock is not enough'
            });
        }
        inventory.stock -= quantity;
        inventory.reserved += quantity;
        await inventory.save();
        await inventory.populate('product');
        res.send(inventory);
    } catch (error) {
        res.status(400).send({
            message: error.message
        });
    }
});

router.post('/sold', async function (req, res) {
    try {
        let product = req.body.product;
        let quantity = Number(req.body.quantity);
        let validation = await validateProductAndQuantity(product, quantity);
        if (!validation.ok) {
            return res.status(400).send({
                message: validation.message
            });
        }
        let inventory = await inventoryModel.findOne({ product: product });
        if (!inventory) {
            return res.status(404).send({
                message: 'inventory not found'
            });
        }
        if (inventory.reserved < quantity) {
            return res.status(400).send({
                message: 'reserved is not enough'
            });
        }
        inventory.reserved -= quantity;
        inventory.soldCount += quantity;
        await inventory.save();
        await inventory.populate('product');
        res.send(inventory);
    } catch (error) {
        res.status(400).send({
            message: error.message
        });
    }
});

module.exports = router;