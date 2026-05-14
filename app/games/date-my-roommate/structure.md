## Classes

### Character
Contains name, image, text color, current entry side
Current entry side can be changed

### DialogueEngine
Contains queue for dialogue
Contains dictionary of character names to characters (Used for displaying animations and text)

### CharacterBehavior 
Contains reference to shared DialogueEngine instance
Is able to enqueue or insert dialogue into dialogue queue

### Game
Manages all instances of classes and contains the single DialogueEngine
Is also able to insert dialogue into the queue

## Order Scene

Character runs command for generating boba order (Do this randomly for now and doesn't have to be on character)

Game selects which character will enter
Game makes character enter the scene
Game queues player greeting selection
 - functions tied to each selection are functions for the character 
 - character.getGreeting(player greeting)
 - this function enqueues 
    1) the dialogue for the character response
    2) the character saying their order
    3) character says thanks
    4) queues the character exit

What might be better is loading up the queue with everything besides the character response, then inserting the response into the front of the queue. 

## Checkout Scene

Game Queues character enters screen
Character function gets queued
 - character responds to how they feel about the order