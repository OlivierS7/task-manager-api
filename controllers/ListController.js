const { List, Task } = require('../models')

/**
 * GET /lists
 * Purpose: Get all lists that belong to the authenticated user
 */
const get = async (req, res) => {
    List.find({
        _userId: req.user_id
    }).then((lists) => {
        res.send(lists)
    })
}

/**
 * POST /lists
 * Purpose: Create a list
 */
const post = async (req, res) => {
    let newList = new List({
        title: req.body.title,
        _userId: req.user_id
    })
    newList.save().then((list) => {
        res.send(list)
    })
}

/**
 * PATCH /lists/:id
 * Purpose: Update a specified list
 */
const patch = async (req, res) => {
    List.findByIdAndUpdate({_id: req.params.id, _userId: req.user_id}, {
        $set: req.body
    }).then(() => {
        res.send({'message': 'Updated successfully'})
    })
}

/**
 * DELETE /lists/:id
 * Purpose: Delete a specified list and all the tasks that are in the list
 */
const remove = async (req, res) => {
    console.log(req.params);
    List.findByIdAndRemove({
        _id: req.params.id,
        _userId: req.user_id
    }).then((removedList) => {
        res.send(removedList)
        deleteTaskFromList(removedList._id)
    })
}

/* Helper Methods */
let deleteTaskFromList = (_listId) => {
    Task.deleteMany({
        _listId
    }).then()
}

module.exports =  {
    get,
    post,
    patch,
    remove
}