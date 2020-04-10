const express = require('express')
const uuidV1 = require('uuid/v1')
const router = express.Router()
const siteConfig = require('../config/inventoryFormData.json')

const inventoryController = require('../controller/inventoryController')

router.get('/', (req, res) => {
  res.redirect('dashboard')
})

router.all('/signin',(req, res) => {
  if (req.method === 'GET') {
    res.render('../templates/signin')
  } else {
    res.redirect('/dashboard')
  }
})

router.get('/signup', (req, res) => {
  res.render('../templates/signup')
})

router.get('/dashboard', async (req, res) => {
  /**
   * Commenting dashboard code for short period.
   */
  /*
  const inventoryData = await inventoryController.readInventory()
  const inventoryCount = await inventoryController.inventoryCount()
  res.render('../templates/dashboard', { 
    inventoryData: inventoryData,
    ...inventoryCount 
  })
  */
 res.redirect('/dashboard/pages/1')
})

router.get('/dashboard/pages/:pageNo', async (req, res) => {
  const currentPage = req.params.pageNo
  const inventoryData = await inventoryController.readInventory(currentPage)
  const inventoryCount = await inventoryController.inventoryCount()
  res.render('../templates/dashboard', { 
    inventoryData: inventoryData,
    ...inventoryCount 
  })
})


router.all('/addInventory', async (req, res) => {
  const contents = {
    pageTitle: 'Add Inventory',
    tabs: [{
      name: 'Basic',
      id: 'basic'
    },{
      name: 'Advanced',
      id: 'advanced'
    }],
    formFields: {
      selectFields: {
        slr: { 
          options: ['Lease', 'Sell', 'Rent']
        },
        buildingType: {
          options: siteConfig.inventoryType
        }
      },
      files: [{
        id: 'frontView',
        name: 'Front View',
        description: "Upload property's front view image",
        type: 'image'
      },{
        id: 'docks',
        name: 'Docks View',
        description: "Upload a dockyard image",
        type: 'image'
      },{
        id: 'insideView1',
        name: 'Inside View 1',
        description: "Upload property's inside image",
        type: 'image'
      },{
        id: 'insideView2',
        name: 'Inside View 2',
        description: "Upload next inside image",
        type: 'image'
      }]
    }
  }
  if (req.method === 'GET') {
    const queryId = req.query.id
    if (queryId) {
      const payload = { id: queryId }
      const inventoryData = await inventoryController.readInventory(payload)
      contents.inventoryData = inventoryData
      contents.payload = payload
      res.render('../templates/addInventory', { contents: contents })
    } else {
      res.render('../templates/addInventory', { contents: contents })
    }
  } else {
    let formData = {}
      try {
        formData.data = req.body
        formData.images = []
        formData.audio = []
        for (let i in req.files) {
          let fileExtension = req.files[i].mimetype.split('/')
          let fileName = i + '_' + uuidV1() + '.' + fileExtension[1]
          await req.files[i].mv(`static/uploads/${fileName}`)
          if (i === 'audioFile') {
            formData.audio.push(fileName)
          } else {
            formData.images.push(fileName) 
          }
        }
      } catch (error) {
        console.log(error)
      }
    if (formData.data && formData.images) {
        if (formData.data.editInventoryId) {
          const inventoryId = formData.data.editInventoryId
          const inventoryData = await inventoryController.readInventory({id: inventoryId})
          let imagesData = new Set()
          formData.images.forEach(image => {
            let imageName = image.split('_')[0]
            for (let uploadedImage of inventoryData.images) {
              if (uploadedImage.indexOf(imageName) !== -1) {
                imagesData.add(image)
              } else {
                imagesData.add(uploadedImage)
              }
            }
          })
          formData.images = [...imagesData.size ? imagesData : inventoryData.images]
          if (formData.audio.length === 0 && inventoryData.audio) {
            formData.audio = inventoryData.audio
          }
          const updateInventoryStatus = await inventoryController.updateInventory(formData)
          res.json(updateInventoryStatus)
        } else {
          const addInventoryStatus = await inventoryController.addInventory(formData)
          res.json(addInventoryStatus)
        }
    } 
  }
})

router.post('/deleteInventory', async (req, res) => {
  const data = req.body
  const deleteStatus = await inventoryController.deleteInventory(data)
  res.json(deleteStatus)
})


module.exports = router