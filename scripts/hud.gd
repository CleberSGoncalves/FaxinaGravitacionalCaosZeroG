extends CanvasLayer

## Interface Gráfica e HUD Responsivo (Godot 4.7.2)

@onready var score_label: Label = $MarginContainer/VBoxContainer/ScoreLabel
@onready var health_bar: ProgressBar = $MarginContainer/VBoxContainer/HealthBar
@onready var game_over_panel: Panel = $GameOverPanel

func _ready() -> void:
	if GameManager:
		GameManager.score_changed.connect(_on_score_changed)
		GameManager.health_changed.connect(_on_health_changed)
		GameManager.game_over.connect(_on_game_over)
	if game_over_panel:
		game_over_panel.visible = false

func _on_score_changed(new_score: int) -> void:
	if score_label:
		score_label.text = "Pontuação: %d" % new_score

func _on_health_changed(new_health: int) -> void:
	if health_bar:
		health_bar.value = new_health

func _on_game_over() -> void:
	if game_over_panel:
		game_over_panel.visible = true

func _on_restart_button_pressed() -> void:
	if game_over_panel:
		game_over_panel.visible = false
	if GameManager:
		GameManager.start_new_game()
	get_tree().reload_current_scene()
