const express = require('express');
const { check } = require('express-validator');
const postControllers = require('../controllers/post-controllers');
const checkauth=require('../middleware/check-auth')
const router = express.Router();

router.get('/posts/:pid', postControllers.getPostById);

router.get('/all_posts',checkauth, postControllers.getallPosts);


router.post(
  '/',
  [
    (check('title').not().isEmpty(),
    check('description').isLength({ min: 5 })
    )
  ],
  checkauth,
  postControllers.createPost
);

router.post(
  '/like/:pid',
  checkauth,
  postControllers.likePost
);


router.post(
  '/unlike/:pid',
  checkauth,
  postControllers.unlikePost
);


router.post(
  '/comment/:pid',
  checkauth,
  postControllers.addComment
);

router.delete('/:pid', checkauth,postControllers.deletePost);

module.exports = router;
