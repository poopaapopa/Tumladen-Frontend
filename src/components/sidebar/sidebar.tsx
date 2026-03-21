import { useState } from 'react';
import styles from './sidebar.module.scss';
import castleImage from '../../assets/castle.png';

const Sidebar = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [selectedGame, setSelectedGame] = useState('carcassonne');

  const handleCreateRoom = () => {
    console.log("Комната создана:", roomName);
    //логика отправки на сервер
    setRoomName(''); 
    setIsModalOpen(false);
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebar_name}>Комнаты</div>
      <div className={styles.sidebar_cards}>

        <div className={styles.sidebar_card}>
          <img src={castleImage} alt="##" className={styles.card_img} />
          <div className={styles.card_info}>
            <div className={styles.card_name}>Название карточки</div>
            <div className={styles.card_settings}>Описание настроек игры в комнате</div>
            <div className={styles.card_footer}>
              <div className={styles.card_waiting}>Ожидание игроков</div>
              <div className={styles.card_players_container}>
                <span className={styles.card_players_nums}>4/5</span>
                  {}
                <span className={styles.user_icon}>👤</span> 
              </div>
            </div>
          </div>
        </div>

      </div>

      <button className={styles.create_button} onClick={() => setIsModalOpen(true)}>Создать</button>

      {isModalOpen && (
        <div className={styles.modal_overlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modal_content} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modal_title}>Создание новой комнаты</div>
            <input 
              type="text" 
              placeholder="Введите название комнаты..." 
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              autoFocus
            />
            <div className={styles.input_group}>
              <label>Выберите игру</label>
              <select 
                value={selectedGame} 
                onChange={(e) => setSelectedGame(e.target.value)}
                className={styles.game_select}
              >
                <option value="carcassonne">Каркассон</option>
              </select>
            </div>
            <div className={styles.modal_buttons}>
              <button className={styles.btn_cancel} onClick={() => setIsModalOpen(false)}>Отмена</button>
              <button className={styles.btn_confirm} onClick={handleCreateRoom}>Создать</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Sidebar